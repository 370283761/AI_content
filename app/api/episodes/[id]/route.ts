import { episodeSchema } from "@/src/modules/content/schemas";
import { updateEpisode } from "@/src/modules/content/service";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    return Response.json(await updateEpisode((await context.params).id, await parseJson(request, episodeSchema.partial())));
  } catch (error) {
    return errorResponse(error);
  }
}
