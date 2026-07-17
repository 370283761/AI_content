import { describe, expect, it } from "vitest";
import { canTransitionProductionStatus } from "@/src/modules/production/production-state";

describe("production state machine", () => {
  it("allows the normal external generation flow", () => {
    expect(canTransitionProductionStatus("todo", "submitted")).toBe(true);
    expect(canTransitionProductionStatus("submitted", "generated")).toBe(true);
    expect(canTransitionProductionStatus("generated", "adopted")).toBe(true);
  });

  it("rejects skipping result upload", () => {
    expect(canTransitionProductionStatus("submitted", "adopted")).toBe(false);
    expect(canTransitionProductionStatus("todo", "adopted")).toBe(false);
  });
});
