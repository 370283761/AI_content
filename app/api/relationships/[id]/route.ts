import { deleteRelationship } from "@/src/modules/content/service";
import { errorResponse } from "@/src/shared/http/api-error";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  try {
    await deleteRelationship((await context.params).id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
