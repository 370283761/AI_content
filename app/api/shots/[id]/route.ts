import { shotSchema } from "@/src/modules/content/schemas";
import { deleteShot, updateShot } from "@/src/modules/content/service";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    return Response.json(await updateShot((await context.params).id, await parseJson(request, shotSchema.partial())));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await deleteShot((await context.params).id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
