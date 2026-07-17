import { updateProjectSchema } from "@/src/modules/projects/schemas";
import { getProject, updateProject } from "@/src/modules/projects/service";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson, serialize } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    return Response.json(serialize(await getProject((await context.params).id)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const body = await parseJson(request, updateProjectSchema);
    return Response.json(serialize(await updateProject((await context.params).id, body)));
  } catch (error) {
    return errorResponse(error);
  }
}
