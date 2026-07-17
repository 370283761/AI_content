import { CharacterRole, ContentStatus, ProductionStatus } from "@prisma/client";
import { z } from "zod";

export const storyBiblePatchSchema = z.object({
  logline: z.string().max(2000).optional(),
  theme: z.string().max(5000).optional(),
  tone: z.string().max(5000).optional(),
  worldbuilding: z.string().max(20_000).optional(),
  coreConflict: z.string().max(5000).optional(),
  mainGoal: z.string().max(5000).optional(),
  immutableFacts: z.array(z.string().max(1000)).max(100).optional(),
  contentStatus: z.nativeEnum(ContentStatus).optional(),
});

export const stylePatchSchema = z.object({
  templateName: z.string().max(120).optional(),
  texture: z.string().max(5000).optional(),
  colorLighting: z.string().max(5000).optional(),
  composition: z.string().max(5000).optional(),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).optional(),
  negativePrompt: z.string().max(10_000).optional(),
  contentStatus: z.nativeEnum(ContentStatus).optional(),
});

export const characterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  age: z.string().max(40).nullable().optional(),
  identity: z.string().max(5000).default(""),
  role: z.nativeEnum(CharacterRole).default(CharacterRole.supporting),
  personality: z.string().max(5000).default(""),
  goal: z.string().max(5000).default(""),
  appearance: z.record(z.unknown()).default({}),
  costumes: z.array(z.string()).default([]),
  iconicItems: z.array(z.string()).default([]),
  forbiddenChanges: z.array(z.string()).default([]),
  visualPrompt: z.string().max(10_000).default(""),
  contentStatus: z.nativeEnum(ContentStatus).default(ContentStatus.draft),
});

export const characterPatchSchema = characterSchema.partial();
export const lockPatchSchema = z.object({ field: z.string().min(1).max(100), locked: z.boolean() });

export const relationshipSchema = z.object({
  fromId: z.string().uuid(),
  toId: z.string().uuid(),
  type: z.string().trim().min(1).max(100),
  strength: z.number().int().min(0).max(100).default(50),
  trajectory: z.string().max(5000).default(""),
});

export const assetSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(5000).default(""),
  visualPrompt: z.string().max(10_000).default(""),
});

export const episodeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  hook: z.string().max(5000).default(""),
  goal: z.string().max(5000).default(""),
  conflict: z.string().max(5000).default(""),
  mainPlot: z.string().max(20_000).default(""),
  cliffhanger: z.string().max(5000).default(""),
  targetDuration: z.number().int().min(15).max(180).default(60),
  order: z.number().int().positive().optional(),
});

export const sceneSchema = z.object({
  title: z.string().trim().min(1).max(200),
  locationId: z.string().uuid().nullable().optional(),
  timeOfDay: z.string().max(80).default(""),
  durationEst: z.number().int().min(0).max(300).default(0),
  characterIds: z.array(z.string().uuid()).default([]),
  visualDescription: z.string().max(20_000).default(""),
  actions: z.array(z.string()).default([]),
  dialogues: z.array(z.object({ speaker: z.string(), line: z.string() })).default([]),
  narration: z.string().max(10_000).default(""),
  emotionalGoal: z.string().max(5000).default(""),
  order: z.number().int().positive().optional(),
});

export const splitSceneSchema = z.object({
  title: z.string().trim().min(1).max(200),
  durationEst: z.number().int().min(0).max(300),
});

export const shotFieldsSchema = z.object({
  characters: z.array(z.string()).default([]),
  location: z.string().default(""),
  shotSize: z.enum(["ecu", "cu", "ms", "ws", "ews"]).default("ms"),
  angle: z.string().default("平视"),
  cameraMovement: z.string().default("固定镜头"),
  action: z.string().default(""),
  expression: z.string().default(""),
  lighting: z.string().default(""),
  styleNote: z.string().default(""),
  dialogueOrNarration: z.string().default(""),
  continuityFromPrev: z.string().default(""),
  continuityToNext: z.string().default(""),
  exclude: z.array(z.string()).default([]),
});

export const shotSchema = z.object({
  sceneId: z.string().uuid().optional(),
  durationEst: z.number().int().min(1).max(30).default(4),
  fields: shotFieldsSchema,
  productionStatus: z.nativeEnum(ProductionStatus).default(ProductionStatus.todo),
  order: z.number().int().positive().optional(),
});

export const splitShotSchema = z.object({ durationEst: z.number().int().min(1).max(29) });
