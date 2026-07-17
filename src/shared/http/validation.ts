import { ZodError, type ZodType } from "zod";

import { ApiError } from "@/src/shared/http/api-error";

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  try {
    return schema.parse(await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(400, "INVALID_REQUEST", "请求参数不正确", {
        issues: error.issues,
      });
    }
    throw new ApiError(400, "INVALID_JSON", "请求体必须是有效 JSON");
  }
}

export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, current) =>
      typeof current === "bigint" ? current.toString() : current,
    ),
  ) as T;
}
