import { mergeShotWithNext } from "@/src/modules/content/service";
import { errorResponse } from "@/src/shared/http/api-error";
type Context = { params: Promise<{ id: string }> };
export async function POST(_request: Request, context: Context) { try { return Response.json(await mergeShotWithNext((await context.params).id)); } catch (error) { return errorResponse(error); } }
