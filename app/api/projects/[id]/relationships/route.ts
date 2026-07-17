import { relationshipSchema } from "@/src/modules/content/schemas";
import { createRelationship } from "@/src/modules/content/service";
import { getProject } from "@/src/modules/projects/service";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    return Response.json((await getProject((await context.params).id)).relationships);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    return Response.json(
      await createRelationship((await context.params).id, await parseJson(request, relationshipSchema)),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
