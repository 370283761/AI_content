import { assetSchema } from "@/src/modules/content/schemas";
import { createAsset } from "@/src/modules/content/service";
import { getProject } from "@/src/modules/projects/service";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) { try { return Response.json((await getProject((await context.params).id)).locations); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request, context: Context) { try { return Response.json(await createAsset((await context.params).id, "location", await parseJson(request, assetSchema)), { status: 201 }); } catch (error) { return errorResponse(error); } }
