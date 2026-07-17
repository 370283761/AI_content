import { lockPatchSchema } from "@/src/modules/content/schemas";
import { setCharacterFieldLock } from "@/src/modules/content/service";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const body = await parseJson(request, lockPatchSchema);
    return Response.json(await setCharacterFieldLock((await context.params).id, body.field, body.locked));
  } catch (error) {
    return errorResponse(error);
  }
}
