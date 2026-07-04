import { z } from "zod";
import type { PulseType } from "./pulse-catalog.js";
import type { SpawnableEventKind } from "./spawn.js";

export const pulseQuestionSchema = z.object({
  text: z.string().min(8).max(220),
  pulse_type: z.enum(["next_goal", "over_under_ht"]),
});

export type PulseQuestionLlm = z.infer<typeof pulseQuestionSchema>;

export type SpawnerInput = {
  eventKind: SpawnableEventKind;
  pulseType: PulseType;
  minute: number;
  linePct?: number;
  templateQuestion: string;
  fixtureId: number;
};

function buildPrompt(input: SpawnerInput): string {
  return [
    "Write one YES/NO sports betting question for a 90-second Solana pulse market.",
    `Event: ${input.eventKind} at minute ${input.minute}, fixture ${input.fixtureId}.`,
    input.linePct != null ? `TxLINE implied YES line: ${input.linePct}%.` : "",
    `Market type must stay ${input.pulseType}.`,
    `Template fallback: "${input.templateQuestion}"`,
    "Return JSON only: { \"text\": string, \"pulse_type\": \"next_goal\" | \"over_under_ht\" }.",
    "No emojis. No gambling guarantees. Under 120 chars.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** LLM Spawner — OPENAI_API_KEY required for model path; else template (real catalog text). */
export async function generateSpawnQuestion(input: SpawnerInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return input.templateQuestion;

  try {
    const { generateObject } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: pulseQuestionSchema,
      prompt: buildPrompt(input),
    });

    const parsed = pulseQuestionSchema.safeParse(object);
    if (!parsed.success) return input.templateQuestion;
    if (parsed.data.pulse_type !== input.pulseType) return input.templateQuestion;
    return parsed.data.text.trim();
  } catch {
    return input.templateQuestion;
  }
}

function demo(): void {
  const sample = pulseQuestionSchema.safeParse({
    text: "Another goal before 67'?",
    pulse_type: "next_goal",
  });
  console.assert(sample.success);
  console.log("spawner-llm demo ok");
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  demo();
}
