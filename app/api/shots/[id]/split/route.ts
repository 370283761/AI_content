import { splitShotSchema } from "@/src/modules/content/schemas";
import { splitShot } from "@/src/modules/content/service";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) { try { const body = await parseJson(request, splitShotSchema); return Response.json(await splitShot((await context.params).id, body.durationEst), { status: 201 }); } catch (error) { return errorResponse(error); } }
