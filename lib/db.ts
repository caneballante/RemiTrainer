import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }

  return sqlClient;
}

export async function checkDatabase() {
  const sql = getSql();
  const rows = (await sql`select now() as now`) as Array<{ now: string }>;
  return rows[0];
}

type SaveWorkoutInput = {
  request: Record<string, unknown>;
  compactContext: Record<string, unknown>;
  originalAiResponse: unknown;
  finalValidatedWorkout: {
    parent_shared_workout_plan: Record<string, unknown>;
    user_specific_adaptations: Array<Record<string, unknown>>;
  };
  source: string;
};

export async function saveWorkoutToDatabase(input: SaveWorkoutInput) {
  const sql = getSql();
  const household = (input.compactContext.household || {}) as { id?: string; name?: string };
  const householdId = household.id || "household_remi";
  const householdName = household.name || "Remi household";
  const sessionId = `session_${crypto.randomUUID()}`;

  await sql`insert into household (id, name, updated_at)
    values (${householdId}, ${householdName}, now())
    on conflict (id) do update set name = excluded.name, updated_at = now()`;

  await sql`insert into shared_workout_sessions (
      id,
      household_id,
      requested_at,
      request,
      compact_context,
      parent_workout_plan,
      original_ai_response,
      final_validated_workout,
      source
    )
    values (
      ${sessionId},
      ${householdId},
      now(),
      ${JSON.stringify(input.request)}::jsonb,
      ${JSON.stringify(input.compactContext)}::jsonb,
      ${JSON.stringify(input.finalValidatedWorkout.parent_shared_workout_plan)}::jsonb,
      ${JSON.stringify(input.originalAiResponse)}::jsonb,
      ${JSON.stringify(input.finalValidatedWorkout)}::jsonb,
      ${input.source}
    )`;

  for (const adaptation of input.finalValidatedWorkout.user_specific_adaptations) {
    const instanceId = String(adaptation.id || `user_instance_${crypto.randomUUID()}`);
    const profileId = String(adaptation.profile_id || "unknown_profile");
    const profileName = String(adaptation.profile_name || profileId);

    await sql`insert into profiles (id, household_id, name, updated_at)
      values (${profileId}, ${householdId}, ${profileName}, now())
      on conflict (id) do update set name = excluded.name, updated_at = now()`;

    await sql`insert into user_workout_instances (
        id,
        shared_workout_session_id,
        profile_id,
        estimated_minutes,
        adaptation_notes,
        warmup,
        cooldown,
        exercises
      )
      values (
        ${instanceId},
        ${sessionId},
        ${profileId},
        ${Number(adaptation.estimated_minutes || 0)},
        ${JSON.stringify(adaptation.adaptation_notes || [])}::jsonb,
        ${JSON.stringify(adaptation.warmup || [])}::jsonb,
        ${JSON.stringify(adaptation.cooldown || [])}::jsonb,
        ${JSON.stringify(adaptation.exercises || [])}::jsonb
      )`;

    const exercises = Array.isArray(adaptation.exercises) ? adaptation.exercises : [];
    for (const exercise of exercises) {
      const exerciseRecord = exercise as Record<string, unknown>;
      const exerciseInstanceId = String(exerciseRecord.id || `exercise_instance_${crypto.randomUUID()}`);

      await sql`insert into workout_exercise_instances (
          id,
          shared_workout_session_id,
          user_workout_instance_id,
          profile_id,
          parent_slot_id,
          movement_pattern,
          exercise_id,
          exercise_name,
          sets,
          reps,
          rest_seconds,
          required_equipment,
          substitution_reason
        )
        values (
          ${exerciseInstanceId},
          ${sessionId},
          ${instanceId},
          ${profileId},
          ${String(exerciseRecord.parent_slot_id || "")},
          ${String(exerciseRecord.movement_pattern || "")},
          ${String(exerciseRecord.exercise_id || "")},
          ${String(exerciseRecord.exercise_name || "")},
          ${Number(exerciseRecord.sets || 0)},
          ${String(exerciseRecord.reps || "")},
          ${Number(exerciseRecord.rest_seconds || 0)},
          ${JSON.stringify(exerciseRecord.required_equipment || [])}::jsonb,
          ${String(exerciseRecord.substitution_reason || "")}
        )`;
    }
  }

  return { sessionId };
}
