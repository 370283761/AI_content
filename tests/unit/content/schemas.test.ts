import { describe, expect, it } from "vitest";

import { shotSchema, storyBiblePatchSchema } from "@/src/modules/content/schemas";

describe("manual content schemas", () => {
  it("accepts a structured shot", () => {
    const result = shotSchema.safeParse({
      durationEst: 4,
      fields: { action: "主角抬头", shotSize: "cu" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects oversized immutable facts", () => {
    const result = storyBiblePatchSchema.safeParse({ immutableFacts: Array(101).fill("事实") });
    expect(result.success).toBe(false);
  });
});
