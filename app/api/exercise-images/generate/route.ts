import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { put } from "@vercel/blob";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { getExerciseInstructionAsset, hasDatabaseUrl, saveExerciseInstructionImage } from "@/lib/db";

export const runtime = "nodejs";

const GenerateExerciseImageBody = z.object({
  exercise_id: z.string().min(1),
  exercise_name: z.string().min(1),
  image_prompt: z.string().min(1),
  steps: z.array(z.string()).default([]),
  easier_version: z.string().default(""),
  harder_version: z.string().default(""),
  common_mistakes: z.array(z.string()).default([]),
  safety_notes: z.array(z.string()).default([]),
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
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 501 });
  }

  const json = await request.json().catch(() => null);
  const parsed = GenerateExerciseImageBody.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid exercise image payload.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  try {
    const existingAsset = await getExerciseInstructionAsset(input.exercise_id);
    const existingImageUrl = String(existingAsset?.instruction_image_url || "");
    if (existingImageUrl) {
      return NextResponse.json({
        exercise_id: input.exercise_id,
        instruction_image_url: existingImageUrl,
        source: "existing",
        asset: existingAsset,
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 501 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN is not configured." }, { status: 501 });
    }

    const client = getOpenAI();
    const prompt = [
      input.image_prompt,
      "Style: clean instructional fitness illustration, neutral background, no text, no logos.",
      "Show safe start and finish positions when possible. Avoid photorealistic nudity or medical diagrams.",
      `Exercise name: ${input.exercise_name}.`,
      input.steps.length ? `Key steps: ${input.steps.join(" ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await client.images.generate({
      model: imageModel,
      prompt,
      size: "1024x1024",
      quality: "medium",
      output_format: "webp",
    });

    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) {
      return NextResponse.json({ error: "OpenAI did not return image data." }, { status: 502 });
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");
    const safeExerciseId = input.exercise_id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const blob = await put(`exercise-instructions/${safeExerciseId}.webp`, imageBuffer, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
    });

    const asset = await saveExerciseInstructionImage({
      exerciseId: input.exercise_id,
      instructionImageUrl: blob.url,
      imagePrompt: input.image_prompt,
      steps: input.steps,
      easierVersion: input.easier_version,
      harderVersion: input.harder_version,
      commonMistakes: input.common_mistakes,
      safetyNotes: input.safety_notes,
    });

    return NextResponse.json({
      exercise_id: input.exercise_id,
      instruction_image_url: blob.url,
      image_model: imageModel,
      source: "generated",
      asset,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown exercise image generation error",
      },
      { status: 500 },
    );
  }
}
