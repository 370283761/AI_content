import { z } from "zod";

import { stylePatchSchema } from "@/src/modules/content/schemas";
import { setBibleFieldLock, updateStyleProfile } from "@/src/modules/content/service";
import { getProject } from "@/src/modules/projects/service";
import { ApiError, errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };
const lockSchema = z.object({ field: z.string().min(1), locked: z.boolean() });

export async function GET(_request: Request, context: Context) {
  try {
    const project = await getProject((await context.params).id);
    if (!project.styleProfile) throw new ApiError(404, "STYLE_PROFILE_NOT_FOUND", "视觉圣经不存在");
    return Response.json(project.styleProfile);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const body = await parseJson(request, stylePatchSchema);
    return Response.json(await updateStyleProfile((await context.params).id, body));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const body = await parseJson(request, lockSchema);
    return Response.json(await setBibleFieldLock((await context.params).id, "style", body.field, body.locked));
  } catch (error) {
    return errorResponse(error);
  }
}
