export type LockableEntity = {
  contentStatus: "draft" | "pending" | "confirmed" | "locked";
  lockedFields: unknown;
};

export type LockGuardResult<T extends Record<string, unknown>> = {
  allowedFields: Partial<T>;
  rejectedFields: Array<keyof T>;
};

export function lockGuard<T extends Record<string, unknown>>(
  entity: LockableEntity,
  incomingPatch: T,
): LockGuardResult<T> {
  const lockedFields = Array.isArray(entity.lockedFields)
    ? new Set(entity.lockedFields.filter((field): field is string => typeof field === "string"))
    : new Set<string>();
  const allowedFields: Partial<T> = {};
  const rejectedFields: Array<keyof T> = [];

  for (const [field, value] of Object.entries(incomingPatch) as Array<[keyof T, T[keyof T]]>) {
    if (entity.contentStatus === "locked" || lockedFields.has(String(field))) {
      rejectedFields.push(field);
    } else {
      allowedFields[field] = value;
    }
  }

  return { allowedFields, rejectedFields };
}
