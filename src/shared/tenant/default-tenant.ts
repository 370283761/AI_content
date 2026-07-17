import { env } from "@/src/shared/config/env";
import { prisma } from "@/src/shared/db/prisma";

export async function getDefaultTenant() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: env.DEFAULT_WORKSPACE_SLUG },
    update: {},
    create: { slug: env.DEFAULT_WORKSPACE_SLUG, name: "本地工作区" },
  });

  const user = await prisma.user.upsert({
    where: { email: env.DEFAULT_USER_EMAIL },
    update: { workspaceId: workspace.id },
    create: { workspaceId: workspace.id, email: env.DEFAULT_USER_EMAIL, name: "本地创作者" },
  });

  return { workspace, user };
}
