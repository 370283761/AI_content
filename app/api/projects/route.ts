import { createProjectSchema } from "@/src/modules/projects/schemas";
import { createProject, listProjects } from "@/src/modules/projects/service";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson, serialize } from "@/src/shared/http/validation";

export async function GET(request: Request) {
  try {
    const archived = new URL(request.url).searchParams.get("archived") === "true";
    return Response.json(serialize(await listProjects(archived)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, createProjectSchema);
    return Response.json(serialize(await createProject(body)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
