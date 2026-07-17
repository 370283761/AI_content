import { Prisma, ProjectStatus } from "@prisma/client";

import { createProjectSchema, updateProjectSchema } from "@/src/modules/projects/schemas";
import { lockGuard } from "@/src/modules/versioning/lock-guard";
import { ApiError } from "@/src/shared/http/api-error";
import { prisma } from "@/src/shared/db/prisma";
import { getDefaultTenant } from "@/src/shared/tenant/default-tenant";

const stageWeights = { setup: 20, planning: 40, script: 60, shots: 80, production: 100 } as const;

export async function createProject(input: unknown) {
  const data = createProjectSchema.parse(input);
  const { workspace, user } = await getDefaultTenant();

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        workspaceId: workspace.id,
        ownerId: user.id,
        name: data.name,
        genre: data.genre,
        sourceKind: data.sourceKind,
        params: data.params,
        quotaLimit: BigInt(process.env.PROJECT_QUOTA_BYTES ?? 1_073_741_824),
        sources: {
          create: {
            kind: data.sourceKind,
            title: data.name,
            content: data.sourceContent,
          },
        },
        storyBible: { create: {} },
        styleProfile: {
          create: {
            templateName: data.params.style,
            aspectRatio: data.params.aspectRatio,
          },
        },
        seasons: { create: { order: 1, title: "第一季" } },
      },
      include: { sources: true, storyBible: true, styleProfile: true, seasons: true },
    });
    return { ...project, completion: stageWeights.setup };
  });
}

export async function listProjects(includeArchived = false) {
  const { workspace, user } = await getDefaultTenant();
  const projects = await prisma.project.findMany({
    where: {
      workspaceId: workspace.id,
      ownerId: user.id,
      deletedAt: null,
      ...(includeArchived ? {} : { status: ProjectStatus.active }),
    },
    include: {
      _count: { select: { characters: true, seasons: true } },
      seasons: { where: { deletedAt: null }, select: { episodes: { where: { deletedAt: null }, select: { id: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((project) => ({
    ...project,
    completion: stageWeights[project.lastStage as keyof typeof stageWeights] ?? 0,
    episodeCount: project.seasons.reduce((total, season) => total + season.episodes.length, 0),
  }));
}

export async function getProject(projectId: string) {
  const { workspace, user } = await getDefaultTenant();
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace.id, ownerId: user.id, deletedAt: null },
    include: {
      sources: { orderBy: { createdAt: "asc" } },
      storyBible: true,
      styleProfile: true,
      characters: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      relationships: { include: { from: true, to: true }, orderBy: { createdAt: "asc" } },
      locations: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      props: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      seasons: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
        include: {
          episodes: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            include: {
              scenes: {
                where: { deletedAt: null },
                orderBy: { order: "asc" },
                include: { shots: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
  if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "项目不存在或已被移除");
  return { ...project, completion: stageWeights[project.lastStage as keyof typeof stageWeights] ?? 0 };
}

export async function updateProject(projectId: string, input: unknown) {
  const data = updateProjectSchema.parse(input);
  const project = await getProject(projectId);
  const currentParams = project.params as Prisma.JsonObject;

  return prisma.$transaction(async (tx) => {
    if (data.sourceContent !== undefined) {
      const source = project.sources[0];
      if (!source) throw new ApiError(409, "SOURCE_NOT_FOUND", "项目原始输入不存在");
      const guarded = lockGuard(source, { content: data.sourceContent });
      if (guarded.rejectedFields.length > 0) {
        throw new ApiError(409, "LOCKED_FIELDS", "原始输入已锁定，无法修改", {
          fields: guarded.rejectedFields,
        });
      }
      await tx.sourceDocument.update({ where: { id: source.id }, data: guarded.allowedFields });
    }

    return tx.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        status: data.status,
        lastStage: data.lastStage,
        params: data.params ? { ...currentParams, ...data.params } : undefined,
      },
    });
  });
}
