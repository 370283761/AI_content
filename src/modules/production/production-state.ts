import type { ProductionStatus } from "@prisma/client";

const transitions: Record<ProductionStatus, ProductionStatus[]> = {
  todo: ["submitted"],
  submitted: ["generated", "todo"],
  generated: ["adopted", "needs_work", "discarded"],
  adopted: ["needs_work"],
  needs_work: ["todo"],
  discarded: ["needs_work"],
};

export function canTransitionProductionStatus(from: ProductionStatus, to: ProductionStatus) {
  return transitions[from].includes(to);
}
