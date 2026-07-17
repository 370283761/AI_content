import { SourceKind } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { createProjectSchema, updateProjectSchema } from "@/src/modules/projects/schemas";

describe("project schemas", () => {
  it("accepts an M1 idea project", () => {
    const result = createProjectSchema.safeParse({
      name: "婚礼前夜",
      sourceKind: SourceKind.idea,
      sourceContent: "少女发现自己的身份被替换。",
      params: { targetEpisodeLength: 60, aspectRatio: "9:16", style: "二次元赛璐璐" },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty project patch", () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
  });
});
