import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { saveWorkoutToDatabase } from "@/lib/db";

export const runtime = "nodejs";

const GenerateWorkoutBody = z.object({
  request: z.record(z.string(), z.unknown()),
  compact_context: z.record(z.string(), z.unknown()),
  draft_parent_plan: z.record(z.string(), z.unknown()),
  exercise_library: z.array(z.record(z.string(), z.unknown())).default([]),
});

let openaiClient: OpenAI | null = null;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openaiClient;
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = GenerateWorkoutBody.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid workout generation payload.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        source: "local_fallback",
        error: "OPENAI_API_KEY is not configured.",
      },
      { status: 501 },
    );
  }

  const body = parsed.data;
  const model = process.env.OPENAI_MODEL || "gpt-5.1";

  try {
    const client = getOpenAI();
    const response = await client.responses.create({
      model,
      instructions: [
        "You are RemiTrainer, a careful household personal trainer.",
        "Return JSON only. Respect the supplied JSON schema exactly.",
        "Use only exercises from the supplied exercise_library by exercise_id.",
        "Respect household equipment, injuries, exercises to avoid, and banned exercises.",
        "Keep shared participants aligned by movement pattern, not necessarily exact exercise.",
        "If one participant cannot do an exercise, substitute the safest same-pattern alternative.",
        "Progress through movement quality, consistency, strength, endurance, smart selection, and recovery balance, not endless length.",
        "Do not generate live images. Copy instruction_image_url and image_prompt fields from the selected exercise when available.",
      ].join("\n"),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  compact_context: body.compact_context,
                  draft_parent_plan: body.draft_parent_plan,
                  exercise_library: body.exercise_library,
                },
                null,
                2,
              ),
            },
          ],
        },
      ],
      text: {
        format: workoutResponseFormat,
      },
    } as OpenAI.Responses.ResponseCreateParamsNonStreaming);

    const outputText = response.output_text;
    const generatedWorkout = JSON.parse(outputText);
    let persistenceStatus: Record<string, unknown> = { saved: false, reason: "DATABASE_URL is not configured." };

    if (process.env.DATABASE_URL) {
      try {
        const saved = await saveWorkoutToDatabase({
          request: body.request,
          compactContext: body.compact_context,
          originalAiResponse: generatedWorkout,
          finalValidatedWorkout: generatedWorkout,
          source: "openai",
        });
        persistenceStatus = { saved: true, ...saved };
      } catch (error) {
        persistenceStatus = {
          saved: false,
          reason: error instanceof Error ? error.message : "Unknown database save error",
        };
      }
    }

    return NextResponse.json({
      source: "openai",
      model,
      original_ai_response: outputText,
      final_validated_workout: generatedWorkout,
      persistence_status: persistenceStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "openai",
        error: error instanceof Error ? error.message : "Unknown OpenAI generation error",
      },
      { status: 500 },
    );
  }
}

const prepItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "order", "exercise_id", "movement_pattern", "name", "dose"],
  properties: {
    id: { type: "string" },
    order: { type: "number" },
    exercise_id: { type: "string" },
    movement_pattern: { type: "string" },
    name: { type: "string" },
    dose: { type: "string" },
  },
};

const parentSlotSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "order", "section", "movement_pattern", "movement_label", "intent"],
  properties: {
    id: { type: "string" },
    order: { type: "number" },
    section: { type: "string" },
    movement_pattern: { type: "string" },
    movement_label: { type: "string" },
    intent: { type: "string" },
  },
};

const exerciseInstanceSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "parent_slot_id",
    "order",
    "section",
    "movement_pattern",
    "movement_label",
    "exercise_id",
    "exercise_name",
    "sets",
    "reps",
    "rest_seconds",
    "required_equipment",
    "substitution_reason",
    "coaching_note",
    "instruction_image_url",
    "image_prompt",
  ],
  properties: {
    id: { type: "string" },
    parent_slot_id: { type: "string" },
    order: { type: "number" },
    section: { type: "string" },
    movement_pattern: { type: "string" },
    movement_label: { type: "string" },
    exercise_id: { type: "string" },
    exercise_name: { type: "string" },
    sets: { type: "number" },
    reps: { type: "string" },
    rest_seconds: { type: "number" },
    required_equipment: { type: "array", items: { type: "string" } },
    substitution_reason: { type: "string" },
    coaching_note: { type: "string" },
    instruction_image_url: { type: "string" },
    image_prompt: { type: "string" },
  },
};

const workoutResponseFormat = {
  type: "json_schema",
  name: "remitrainer_shared_workout",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["parent_shared_workout_plan", "user_specific_adaptations", "generation_rules_applied"],
    properties: {
      parent_shared_workout_plan: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "workout_size", "shared_alignment_rule", "warmup", "slots", "cooldown"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          workout_size: { type: "number" },
          shared_alignment_rule: { type: "string" },
          warmup: { type: "array", items: prepItemSchema },
          slots: { type: "array", items: parentSlotSchema },
          cooldown: { type: "array", items: prepItemSchema },
        },
      },
      user_specific_adaptations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "profile_id",
            "profile_name",
            "estimated_minutes",
            "adaptation_notes",
            "warmup",
            "exercises",
            "cooldown",
          ],
          properties: {
            id: { type: "string" },
            profile_id: { type: "string" },
            profile_name: { type: "string" },
            estimated_minutes: { type: "number" },
            adaptation_notes: { type: "array", items: { type: "string" } },
            warmup: { type: "array", items: prepItemSchema },
            exercises: { type: "array", items: exerciseInstanceSchema },
            cooldown: { type: "array", items: prepItemSchema },
          },
        },
      },
      generation_rules_applied: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
} as const;
