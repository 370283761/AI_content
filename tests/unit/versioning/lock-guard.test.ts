import { describe, expect, it } from "vitest";
import { lockGuard } from "@/src/modules/versioning/lock-guard";

describe("lockGuard", () => {
  it("rejects individual locked fields", () => {
    const result = lockGuard(
      { contentStatus: "confirmed", lockedFields: ["iconicItems"] },
      { name: "林晚", iconicItems: ["红色手绳"] },
    );

    expect(result.allowedFields).toEqual({ name: "林晚" });
    expect(result.rejectedFields).toEqual(["iconicItems"]);
  });

  it("rejects every field when the entity is locked", () => {
    const result = lockGuard(
      { contentStatus: "locked", lockedFields: [] },
      { name: "新名字", age: "28" },
    );

    expect(result.allowedFields).toEqual({});
    expect(result.rejectedFields).toEqual(["name", "age"]);
  });
});
