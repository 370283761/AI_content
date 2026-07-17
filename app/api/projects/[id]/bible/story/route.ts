import { z } from "zod";

import { storyBiblePatchSchema } from "@/src/modules/content/schemas";
import { setBibleFieldLock, updateStoryBible } from "@/src/modules/content/service";
import { getProject } from "@/src/modules/projects/service";
import { ApiError, errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };
const lockSchema = z.object({ field: z.string().min(1), locked: z.boolean() });

export async function GET(_request: Request, context: Context) {
  try {
    const project = await getProject((await context.params).id);
    if (!project.storyBible) throw new ApiError(404, "STORY_BIBLE_NOT_FOUND", "故事圣经不存在");
    return Response.json(project.storyBible);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const body = await parseJson(request, storyBiblePatchSchema);
    return Response.json(await updateStoryBible((await context.params).id, body));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const body = await parseJson(request, lockSchema);
    return Response.json(await setBibleFieldLock((await context.params).id, "story", body.field, body.locked));
  } catch (error) {
    return errorResponse(error);
  }
}
