import { shotSchema } from "@/src/modules/content/schemas";
import { createShot } from "@/src/modules/content/service";
import { prisma } from "@/src/shared/db/prisma";
import { errorResponse } from "@/src/shared/http/api-error";
import { parseJson } from "@/src/shared/http/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const episodeId = (await context.params).id;
    return Response.json(
      await prisma.shot.findMany({
        where: { scene: { episodeId }, deletedAt: null },
        include: { scene: { select: { id: true, order: true, title: true } } },
        orderBy: { order: "asc" },
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    return Response.json(await createShot((await context.params).id, await parseJson(request, shotSchema)), {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
