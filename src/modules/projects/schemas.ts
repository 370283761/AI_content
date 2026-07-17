import { ProjectStatus, SourceKind } from "@prisma/client";
import { z } from "zod";

export const projectParamsSchema = z.object({
  targetEpisodeLength: z.number().int().min(15).max(180).default(60),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  style: z.string().min(1).max(120).default("二次元赛璐璐"),
  targetChapters: z.number().int().min(1).max(20).optional(),
  targetWordsPerChapter: z.number().int().min(300).max(10000).optional(),
  audienceHint: z.string().max(300).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  genre: z.string().trim().min(1).max(80).default("动漫短剧"),
  sourceKind: z.nativeEnum(SourceKind),
  sourceContent: z.string().max(500_000).default(""),
  params: projectParamsSchema,
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    lastStage: z.enum(["setup", "planning", "script", "shots", "production"]).optional(),
    params: projectParamsSchema.partial().optional(),
    sourceContent: z.string().max(500_000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "至少提供一个更新字段");
