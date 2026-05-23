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

const DEFAULT_HOUSEHOLD_ID = "household_remi";
const DEFAULT_HOUSEHOLD_NAME = "Remi household";

type HouseholdState = {
  household?: Record<string, unknown>;
  profiles?: Array<Record<string, unknown>>;
  household_equipment?: Array<Record<string, unknown>>;
  profile_limitations?: Array<Record<string, unknown>>;
  profile_banned_exercises?: Array<Record<string, unknown>>;
  shared_workout_sessions?: Array<Record<string, unknown>>;
  user_workout_instances?: Array<Record<string, unknown>>;
  workout_exercise_instances?: Array<Record<string, unknown>>;
  exercise_feedback?: Array<Record<string, unknown>>;
  exercise_instruction_assets?: Array<Record<string, unknown>>;
};

type SharedWorkoutInviteInput = {
  sessionId: string;
  fromProfileId: string;
  toProfileId: string;
};

export async function saveWorkoutToDatabase(input: SaveWorkoutInput) {
  const sql = getSql();
  const household = (input.compactContext.household || {}) as { id?: string; name?: string };
  const householdId = household.id || DEFAULT_HOUSEHOLD_ID;
  const householdName = household.name || DEFAULT_HOUSEHOLD_NAME;
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

export async function createSharedWorkoutInvite(input: SharedWorkoutInviteInput) {
  const sql = getSql();
  await ensureSharedWorkoutInviteTable();

  const inviteId = `invite_${crypto.randomUUID()}`;
  const rows = (await sql`
    insert into shared_workout_invites (
      id,
      shared_workout_session_id,
      from_profile_id,
      to_profile_id,
      status,
      created_at,
      opened_at,
      dismissed_at
    )
    values (
      ${inviteId},
      ${input.sessionId},
      ${input.fromProfileId},
      ${input.toProfileId},
      'pending',
      now(),
      null,
      null
    )
    on conflict (shared_workout_session_id, to_profile_id) do update set
      from_profile_id = excluded.from_profile_id,
      status = 'pending',
      created_at = now(),
      opened_at = null,
      dismissed_at = null
    returning
      id,
      shared_workout_session_id,
      from_profile_id,
      to_profile_id,
      status,
      created_at::text,
      opened_at::text,
      dismissed_at::text
  `) as Array<Record<string, unknown>>;

  return rows[0];
}

export async function getPendingSharedWorkoutInvites(profileId: string) {
  const sql = getSql();
  await ensureSharedWorkoutInviteTable();

  return (await sql`
    select
      i.id,
      i.shared_workout_session_id,
      i.from_profile_id,
      from_profile.name as from_profile_name,
      i.to_profile_id,
      to_profile.name as to_profile_name,
      i.status,
      i.created_at::text,
      i.opened_at::text,
      i.dismissed_at::text,
      s.requested_at::text,
      s.parent_workout_plan ->> 'title' as workout_title,
      s.parent_workout_plan ->> 'workout_size' as workout_size
    from shared_workout_invites i
    join shared_workout_sessions s on s.id = i.shared_workout_session_id
    join profiles from_profile on from_profile.id = i.from_profile_id
    join profiles to_profile on to_profile.id = i.to_profile_id
    where i.to_profile_id = ${profileId}
      and i.status = 'pending'
    order by i.created_at desc
    limit 5
  `) as Array<Record<string, unknown>>;
}

export async function markSharedWorkoutInvite(inviteId: string, profileId: string, status: "opened" | "dismissed") {
  const sql = getSql();
  await ensureSharedWorkoutInviteTable();

  const rows = (await sql`
    update shared_workout_invites
    set
      status = ${status},
      opened_at = case when ${status} = 'opened' then now() else opened_at end,
      dismissed_at = case when ${status} = 'dismissed' then now() else dismissed_at end
    where id = ${inviteId}
      and to_profile_id = ${profileId}
    returning
      id,
      shared_workout_session_id,
      from_profile_id,
      to_profile_id,
      status,
      created_at::text,
      opened_at::text,
      dismissed_at::text
  `) as Array<Record<string, unknown>>;

  return rows[0] || null;
}

export async function saveExerciseInstructionImage(input: {
  exerciseId: string;
  instructionImageUrl: string;
  imagePrompt: string;
  steps?: Array<string>;
  easierVersion?: string;
  harderVersion?: string;
  commonMistakes?: Array<string>;
  safetyNotes?: Array<string>;
}) {
  const sql = getSql();

  const rows = (await sql`
    insert into exercise_instruction_assets (
      exercise_id,
      instruction_image_url,
      image_prompt,
      steps,
      easier_version,
      harder_version,
      common_mistakes,
      safety_notes,
      updated_at
    )
    values (
      ${input.exerciseId},
      ${input.instructionImageUrl},
      ${input.imagePrompt},
      ${JSON.stringify(input.steps || [])}::jsonb,
      ${nullableString(input.easierVersion)},
      ${nullableString(input.harderVersion)},
      ${JSON.stringify(input.commonMistakes || [])}::jsonb,
      ${nullableString(input.safetyNotes)},
      now()
    )
    on conflict (exercise_id) do update set
      instruction_image_url = excluded.instruction_image_url,
      image_prompt = excluded.image_prompt,
      steps = case when excluded.steps = '[]'::jsonb then exercise_instruction_assets.steps else excluded.steps end,
      easier_version = coalesce(excluded.easier_version, exercise_instruction_assets.easier_version),
      harder_version = coalesce(excluded.harder_version, exercise_instruction_assets.harder_version),
      common_mistakes = case
        when excluded.common_mistakes = '[]'::jsonb then exercise_instruction_assets.common_mistakes
        else excluded.common_mistakes
      end,
      safety_notes = case
        when excluded.safety_notes = '[]'::jsonb then exercise_instruction_assets.safety_notes
        else excluded.safety_notes
      end,
      updated_at = now()
    returning
      exercise_id,
      instruction_image_url,
      image_prompt,
      steps,
      easier_version,
      harder_version,
      common_mistakes,
      safety_notes,
      updated_at::text
  `) as Array<Record<string, unknown>>;

  return rows[0];
}

async function ensureSharedWorkoutInviteTable() {
  const sql = getSql();
  await sql`create table if not exists shared_workout_invites (
    id text primary key,
    shared_workout_session_id text not null references shared_workout_sessions(id) on delete cascade,
    from_profile_id text not null references profiles(id) on delete cascade,
    to_profile_id text not null references profiles(id) on delete cascade,
    status text not null default 'pending',
    created_at timestamptz not null default now(),
    opened_at timestamptz,
    dismissed_at timestamptz,
    unique (shared_workout_session_id, to_profile_id)
  )`;

  await sql`create index if not exists shared_workout_invites_to_status_idx
    on shared_workout_invites (to_profile_id, status, created_at desc)`;
}

export async function loadHouseholdState(householdId = DEFAULT_HOUSEHOLD_ID) {
  const sql = getSql();

  const householdRows = (await sql`
    select id, name, created_at::text, updated_at::text
    from household
    where id = ${householdId}
  `) as Array<Record<string, unknown>>;

  const profiles = (await sql`
    select
      id,
      household_id,
      name,
      age,
      sex,
      weight::float as weight,
      fitness_level,
      goals,
      preferred_workout_style,
      preferred_mix,
      injuries_or_limitations,
      exercises_to_avoid,
      permanently_banned_exercises,
      created_at::text,
      updated_at::text
    from profiles
    where household_id = ${householdId}
    order by case when id = 'jeanne' then 0 when id = 'jon' then 1 else 2 end, name
  `) as Array<Record<string, unknown>>;

  const householdEquipment = (await sql`
    select household_id, equipment_id, available, updated_at::text
    from household_equipment
    where household_id = ${householdId}
    order by equipment_id
  `) as Array<Record<string, unknown>>;

  const profileLimitations = (await sql`
    select l.id, l.profile_id, l.type, l.value, l.severity, l.created_at::text
    from profile_limitations l
    join profiles p on p.id = l.profile_id
    where p.household_id = ${householdId}
    order by l.profile_id, l.created_at
  `) as Array<Record<string, unknown>>;

  const profileBans = (await sql`
    select b.id, b.profile_id, b.exercise_id, b.exercise_name, b.banned_at::text, b.reason
    from profile_banned_exercises b
    join profiles p on p.id = b.profile_id
    where p.household_id = ${householdId}
    order by b.banned_at
  `) as Array<Record<string, unknown>>;

  const sessions = (await sql`
    with recent_sessions as (
      select *
      from shared_workout_sessions
      where household_id = ${householdId}
      order by requested_at desc
      limit 30
    )
    select
      id,
      household_id,
      requested_at::text,
      request,
      compact_context,
      parent_workout_plan,
      original_ai_response,
      final_validated_workout,
      source
    from recent_sessions
    order by requested_at
  `) as Array<Record<string, unknown>>;

  const instances = (await sql`
    with recent_sessions as (
      select id, requested_at
      from shared_workout_sessions
      where household_id = ${householdId}
      order by requested_at desc
      limit 30
    )
    select
      u.id,
      u.shared_workout_session_id,
      u.profile_id,
      u.estimated_minutes,
      u.adaptation_notes,
      u.warmup,
      u.cooldown,
      u.exercises
    from user_workout_instances u
    join recent_sessions s on s.id = u.shared_workout_session_id
    order by s.requested_at, u.profile_id
  `) as Array<Record<string, unknown>>;

  const exerciseInstances = (await sql`
    with recent_sessions as (
      select id, requested_at
      from shared_workout_sessions
      where household_id = ${householdId}
      order by requested_at desc
      limit 30
    )
    select
      e.id,
      e.shared_workout_session_id,
      e.user_workout_instance_id,
      e.profile_id,
      e.parent_slot_id,
      e.movement_pattern,
      e.exercise_id,
      e.exercise_name,
      e.sets,
      e.reps,
      e.rest_seconds,
      e.required_equipment,
      e.substitution_reason,
      e.completed_at::text
    from workout_exercise_instances e
    join recent_sessions s on s.id = e.shared_workout_session_id
    order by s.requested_at, e.profile_id, e.parent_slot_id
  `) as Array<Record<string, unknown>>;

  const feedback = (await sql`
    select *
    from (
      select
        f.id,
        f.profile_id,
        f.shared_workout_session_id,
        f.user_workout_instance_id,
        f.workout_exercise_instance_id,
        f.exercise_id,
        f.exercise_name,
        f.rating,
        f.logged_at::text
      from exercise_feedback f
      join profiles p on p.id = f.profile_id
      where p.household_id = ${householdId}
      order by f.logged_at desc
      limit 300
    ) recent_feedback
    order by logged_at
  `) as Array<Record<string, unknown>>;

  const instructionAssets = (await sql`
    select
      exercise_id,
      instruction_image_url,
      image_prompt,
      steps,
      easier_version,
      harder_version,
      common_mistakes,
      safety_notes,
      updated_at::text
    from exercise_instruction_assets
    order by exercise_id
  `) as Array<Record<string, unknown>>;

  return {
    version: 2,
    household:
      householdRows[0] ||
      {
        id: householdId,
        name: DEFAULT_HOUSEHOLD_NAME,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    profiles,
    household_equipment: householdEquipment,
    profile_limitations: profileLimitations,
    profile_banned_exercises: profileBans,
    shared_workout_sessions: sessions,
    user_workout_instances: instances,
    workout_exercise_instances: exerciseInstances,
    exercise_feedback: feedback,
    exercise_instruction_assets: instructionAssets,
  };
}

export async function saveHouseholdSnapshot(state: HouseholdState) {
  const sql = getSql();
  const household = state.household || {};
  const householdId = String(household.id || DEFAULT_HOUSEHOLD_ID);
  const householdName = String(household.name || DEFAULT_HOUSEHOLD_NAME);

  await sql`insert into household (id, name, updated_at)
    values (${householdId}, ${householdName}, now())
    on conflict (id) do update set name = excluded.name, updated_at = now()`;

  for (const profile of state.profiles || []) {
    const profileId = String(profile.id || "");
    if (!profileId) continue;

    await sql`insert into profiles (
        id,
        household_id,
        name,
        age,
        sex,
        weight,
        fitness_level,
        goals,
        preferred_workout_style,
        preferred_mix,
        injuries_or_limitations,
        exercises_to_avoid,
        permanently_banned_exercises,
        updated_at
      )
      values (
        ${profileId},
        ${String(profile.household_id || householdId)},
        ${String(profile.name || profileId)},
        ${numberOrNull(profile.age)},
        ${nullableString(profile.sex)},
        ${numberOrNull(profile.weight)},
        ${nullableString(profile.fitness_level)},
        ${nullableString(profile.goals)},
        ${nullableString(profile.preferred_workout_style)},
        ${nullableString(profile.preferred_mix)},
        ${nullableString(profile.injuries_or_limitations)},
        ${nullableString(profile.exercises_to_avoid)},
        ${nullableString(profile.permanently_banned_exercises)},
        now()
      )
      on conflict (id) do update set
        household_id = excluded.household_id,
        name = excluded.name,
        age = excluded.age,
        sex = excluded.sex,
        weight = excluded.weight,
        fitness_level = excluded.fitness_level,
        goals = excluded.goals,
        preferred_workout_style = excluded.preferred_workout_style,
        preferred_mix = excluded.preferred_mix,
        injuries_or_limitations = excluded.injuries_or_limitations,
        exercises_to_avoid = excluded.exercises_to_avoid,
        permanently_banned_exercises = excluded.permanently_banned_exercises,
        updated_at = now()`;
  }

  for (const equipment of state.household_equipment || []) {
    const equipmentId = String(equipment.equipment_id || "");
    if (!equipmentId) continue;

    await sql`insert into household_equipment (household_id, equipment_id, available, updated_at)
      values (${String(equipment.household_id || householdId)}, ${equipmentId}, ${Boolean(equipment.available)}, now())
      on conflict (household_id, equipment_id) do update set available = excluded.available, updated_at = now()`;
  }

  const profileIds = new Set((state.profiles || []).map((profile) => String(profile.id || "")).filter(Boolean));
  for (const profileId of profileIds) {
    await sql`delete from profile_limitations where profile_id = ${profileId}`;
  }

  for (const limitation of state.profile_limitations || []) {
    const limitationId = String(limitation.id || "");
    const profileId = String(limitation.profile_id || "");
    if (!limitationId || !profileId || !profileIds.has(profileId)) continue;

    await sql`insert into profile_limitations (id, profile_id, type, value, severity)
      values (
        ${limitationId},
        ${profileId},
        ${String(limitation.type || "injury_or_limitation")},
        ${String(limitation.value || "")},
        ${nullableString(limitation.severity)}
      )
      on conflict (id) do update set
        type = excluded.type,
        value = excluded.value,
        severity = excluded.severity`;
  }

  for (const ban of state.profile_banned_exercises || []) {
    const profileId = String(ban.profile_id || "");
    const exerciseId = String(ban.exercise_id || "");
    if (!profileId || !exerciseId || !profileIds.has(profileId)) continue;

    await sql`insert into profile_banned_exercises (id, profile_id, exercise_id, exercise_name, banned_at, reason)
      values (
        ${String(ban.id || `ban_${crypto.randomUUID()}`)},
        ${profileId},
        ${exerciseId},
        ${String(ban.exercise_name || exerciseId)},
        ${dateOrNow(ban.banned_at)},
        ${nullableString(ban.reason)}
      )
      on conflict (profile_id, exercise_id) do update set
        exercise_name = excluded.exercise_name,
        reason = excluded.reason`;
  }

  const sessionIds = new Set<string>();
  for (const session of state.shared_workout_sessions || []) {
    const sessionId = String(session.id || "");
    if (!sessionId) continue;
    sessionIds.add(sessionId);

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
        ${String(session.household_id || householdId)},
        ${dateOrNow(session.requested_at)},
        ${JSON.stringify(session.request || {})}::jsonb,
        ${JSON.stringify(session.compact_context || {})}::jsonb,
        ${JSON.stringify(session.parent_workout_plan || {})}::jsonb,
        ${JSON.stringify(session.original_ai_response || null)}::jsonb,
        ${JSON.stringify(session.final_validated_workout || {})}::jsonb,
        ${String((session.cloud as Record<string, unknown> | undefined)?.source || session.source || "browser")}
      )
      on conflict (id) do update set
        request = excluded.request,
        compact_context = excluded.compact_context,
        parent_workout_plan = excluded.parent_workout_plan,
        original_ai_response = excluded.original_ai_response,
        final_validated_workout = excluded.final_validated_workout,
        source = excluded.source`;
  }

  const instanceIds = new Set<string>();
  for (const instance of state.user_workout_instances || []) {
    const instanceId = String(instance.id || "");
    const sessionId = String(instance.shared_workout_session_id || "");
    const profileId = String(instance.profile_id || "");
    if (!instanceId || !sessionIds.has(sessionId) || !profileIds.has(profileId)) continue;
    instanceIds.add(instanceId);

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
        ${numberOrNull(instance.estimated_minutes)},
        ${JSON.stringify(instance.adaptation_notes || [])}::jsonb,
        ${JSON.stringify(instance.warmup || [])}::jsonb,
        ${JSON.stringify(instance.cooldown || [])}::jsonb,
        ${JSON.stringify(instance.exercises || [])}::jsonb
      )
      on conflict (id) do update set
        estimated_minutes = excluded.estimated_minutes,
        adaptation_notes = excluded.adaptation_notes,
        warmup = excluded.warmup,
        cooldown = excluded.cooldown,
        exercises = excluded.exercises`;
  }

  const exerciseInstanceIds = new Set<string>();
  for (const exercise of state.workout_exercise_instances || []) {
    const exerciseInstanceId = String(exercise.id || "");
    const sessionId = String(exercise.shared_workout_session_id || "");
    const instanceId = String(exercise.user_workout_instance_id || "");
    const profileId = String(exercise.profile_id || "");
    if (!exerciseInstanceId || !sessionIds.has(sessionId) || !instanceIds.has(instanceId) || !profileIds.has(profileId)) {
      continue;
    }
    exerciseInstanceIds.add(exerciseInstanceId);

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
        substitution_reason,
        completed_at
      )
      values (
        ${exerciseInstanceId},
        ${sessionId},
        ${instanceId},
        ${profileId},
        ${nullableString(exercise.parent_slot_id)},
        ${String(exercise.movement_pattern || "")},
        ${String(exercise.exercise_id || "")},
        ${String(exercise.exercise_name || "")},
        ${numberOrNull(exercise.sets)},
        ${nullableString(exercise.reps)},
        ${numberOrNull(exercise.rest_seconds)},
        ${JSON.stringify(exercise.required_equipment || [])}::jsonb,
        ${nullableString(exercise.substitution_reason)},
        ${nullableDate(exercise.completed_at)}
      )
      on conflict (id) do update set
        movement_pattern = excluded.movement_pattern,
        exercise_id = excluded.exercise_id,
        exercise_name = excluded.exercise_name,
        sets = excluded.sets,
        reps = excluded.reps,
        rest_seconds = excluded.rest_seconds,
        required_equipment = excluded.required_equipment,
        substitution_reason = excluded.substitution_reason,
        completed_at = excluded.completed_at`;
  }

  for (const feedback of state.exercise_feedback || []) {
    const feedbackId = String(feedback.id || "");
    const profileId = String(feedback.profile_id || "");
    const exerciseId = String(feedback.exercise_id || "");
    if (!feedbackId || !profileId || !exerciseId || !profileIds.has(profileId)) continue;

    await sql`insert into exercise_feedback (
        id,
        profile_id,
        shared_workout_session_id,
        user_workout_instance_id,
        workout_exercise_instance_id,
        exercise_id,
        exercise_name,
        rating,
        logged_at
      )
      values (
        ${feedbackId},
        ${profileId},
        ${nullableKnownId(feedback.shared_workout_session_id, sessionIds)},
        ${nullableKnownId(feedback.user_workout_instance_id, instanceIds)},
        ${nullableKnownId(feedback.workout_exercise_instance_id, exerciseInstanceIds)},
        ${exerciseId},
        ${nullableString(feedback.exercise_name)},
        ${String(feedback.rating || "")},
        ${dateOrNow(feedback.logged_at)}
      )
      on conflict (id) do update set
        rating = excluded.rating,
        logged_at = excluded.logged_at`;
  }

  for (const asset of state.exercise_instruction_assets || []) {
    const exerciseId = String(asset.exercise_id || "");
    if (!exerciseId) continue;

    await sql`insert into exercise_instruction_assets (
        exercise_id,
        instruction_image_url,
        image_prompt,
        steps,
        easier_version,
        harder_version,
        common_mistakes,
        safety_notes,
        updated_at
      )
      values (
        ${exerciseId},
        ${nullableString(asset.instruction_image_url)},
        ${nullableString(asset.image_prompt)},
        ${JSON.stringify(asset.steps || [])}::jsonb,
        ${nullableString(asset.easier_version)},
        ${nullableString(asset.harder_version)},
        ${JSON.stringify(asset.common_mistakes || [])}::jsonb,
        ${JSON.stringify(asset.safety_notes || [])}::jsonb,
        now()
      )
      on conflict (exercise_id) do update set
        instruction_image_url = excluded.instruction_image_url,
        image_prompt = excluded.image_prompt,
        steps = excluded.steps,
        easier_version = excluded.easier_version,
        harder_version = excluded.harder_version,
        common_mistakes = excluded.common_mistakes,
        safety_notes = excluded.safety_notes,
        updated_at = now()`;
  }

  return { householdId };
}

function nullableString(value: unknown) {
  const text = String(value ?? "");
  return text ? text : null;
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function dateOrNow(value: unknown) {
  const date = value ? new Date(String(value)) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function nullableDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function nullableKnownId(value: unknown, knownIds: Set<string>) {
  const id = String(value || "");
  return id && knownIds.has(id) ? id : null;
}
