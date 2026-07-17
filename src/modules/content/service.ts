import { Prisma } from "@prisma/client";

import {
  assetSchema,
  characterPatchSchema,
  characterSchema,
  episodeSchema,
  relationshipSchema,
  sceneSchema,
  shotSchema,
  storyBiblePatchSchema,
  stylePatchSchema,
} from "@/src/modules/content/schemas";
import { lockGuard } from "@/src/modules/versioning/lock-guard";
import { ApiError } from "@/src/shared/http/api-error";
import { prisma } from "@/src/shared/db/prisma";
import { getProject } from "@/src/modules/projects/service";

type LockableRecord = { contentStatus: "draft" | "pending" | "confirmed" | "locked"; lockedFields: Prisma.JsonValue };

function guardedData<T extends Record<string, unknown>>(entity: LockableRecord, patch: T) {
  const result = lockGuard(entity, patch);
  if (result.rejectedFields.length > 0) {
    throw new ApiError(409, "LOCKED_FIELDS", "部分字段已锁定，无法修改", {
      fields: result.rejectedFields,
    });
  }
  return result.allowedFields;
}

function stringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function updateStoryBible(projectId: string, input: unknown) {
  const project = await getProject(projectId);
  if (!project.storyBible) throw new ApiError(404, "STORY_BIBLE_NOT_FOUND", "故事圣经不存在");
  const patch = storyBiblePatchSchema.parse(input);
  return prisma.storyBible.update({
    where: { projectId },
    data: guardedData(project.storyBible, patch) as Prisma.StoryBibleUpdateInput,
  });
}

export async function updateStyleProfile(projectId: string, input: unknown) {
  const project = await getProject(projectId);
  if (!project.styleProfile) throw new ApiError(404, "STYLE_PROFILE_NOT_FOUND", "视觉圣经不存在");
  const patch = stylePatchSchema.parse(input);
  return prisma.styleProfile.update({
    where: { projectId },
    data: guardedData(project.styleProfile, patch) as Prisma.StyleProfileUpdateInput,
  });
}

export async function setBibleFieldLock(
  projectId: string,
  kind: "story" | "style",
  field: string,
  locked: boolean,
) {
  const project = await getProject(projectId);
  const entity = kind === "story" ? project.storyBible : project.styleProfile;
  if (!entity) throw new ApiError(404, "BIBLE_NOT_FOUND", "设定内容不存在");
  const fields = new Set(stringArray(entity.lockedFields));
  if (locked) fields.add(field);
  else fields.delete(field);
  const data = { lockedFields: [...fields] };
  return kind === "story"
    ? prisma.storyBible.update({ where: { projectId }, data })
    : prisma.styleProfile.update({ where: { projectId }, data });
}

export async function createCharacter(projectId: string, input: unknown) {
  await getProject(projectId);
  const data = characterSchema.parse(input);
  return prisma.character.create({
    data: {
      ...data,
      projectId,
      appearance: data.appearance as Prisma.InputJsonValue,
      costumes: data.costumes,
      iconicItems: data.iconicItems,
      forbiddenChanges: data.forbiddenChanges,
    },
  });
}

export async function updateCharacter(characterId: string, input: unknown) {
  const character = await prisma.character.findFirst({ where: { id: characterId, deletedAt: null } });
  if (!character) throw new ApiError(404, "CHARACTER_NOT_FOUND", "角色不存在");
  await getProject(character.projectId);
  const patch = characterPatchSchema.parse(input);
  return prisma.character.update({
    where: { id: characterId },
    data: guardedData(character, patch) as Prisma.CharacterUpdateInput,
  });
}

export async function setCharacterFieldLock(characterId: string, field: string, locked: boolean) {
  const character = await prisma.character.findFirst({ where: { id: characterId, deletedAt: null } });
  if (!character) throw new ApiError(404, "CHARACTER_NOT_FOUND", "角色不存在");
  await getProject(character.projectId);
  const fields = new Set(stringArray(character.lockedFields));
  if (locked) fields.add(field);
  else fields.delete(field);
  return prisma.character.update({ where: { id: characterId }, data: { lockedFields: [...fields] } });
}

export async function deleteCharacter(characterId: string) {
  const character = await prisma.character.findFirst({ where: { id: characterId, deletedAt: null } });
  if (!character) throw new ApiError(404, "CHARACTER_NOT_FOUND", "角色不存在");
  await getProject(character.projectId);
  const scenes = await prisma.scene.findMany({
    where: { episode: { season: { projectId: character.projectId } }, deletedAt: null },
    select: { id: true, title: true, characterIds: true },
  });
  const references = scenes.filter((scene) => stringArray(scene.characterIds).includes(characterId));
  if (references.length > 0) {
    throw new ApiError(409, "CHARACTER_IN_USE", "角色已被场景引用，不能直接删除", { references });
  }
  return prisma.character.update({ where: { id: characterId }, data: { deletedAt: new Date() } });
}

export async function createRelationship(projectId: string, input: unknown) {
  await getProject(projectId);
  const data = relationshipSchema.parse(input);
  if (data.fromId === data.toId) throw new ApiError(400, "INVALID_RELATIONSHIP", "角色不能与自己建立关系");
  const count = await prisma.character.count({
    where: { projectId, id: { in: [data.fromId, data.toId] }, deletedAt: null },
  });
  if (count !== 2) throw new ApiError(400, "CHARACTER_NOT_FOUND", "关系中的角色不存在");
  return prisma.relationship.create({ data: { projectId, ...data }, include: { from: true, to: true } });
}

export async function deleteRelationship(relationshipId: string) {
  const relationship = await prisma.relationship.findUnique({ where: { id: relationshipId } });
  if (!relationship) throw new ApiError(404, "RELATIONSHIP_NOT_FOUND", "关系不存在");
  await getProject(relationship.projectId);
  return prisma.relationship.delete({ where: { id: relationshipId } });
}

export async function createAsset(projectId: string, kind: "location" | "prop", input: unknown) {
  await getProject(projectId);
  const data = assetSchema.parse(input);
  return kind === "location"
    ? prisma.location.create({ data: { projectId, ...data } })
    : prisma.prop.create({ data: { projectId, ...data } });
}

export async function updateAsset(assetId: string, kind: "location" | "prop", input: unknown) {
  const data = assetSchema.partial().parse(input);
  if (kind === "location") {
    const asset = await prisma.location.findFirst({ where: { id: assetId, deletedAt: null } });
    if (!asset) throw new ApiError(404, "LOCATION_NOT_FOUND", "场景资产不存在");
    await getProject(asset.projectId);
    return prisma.location.update({ where: { id: assetId }, data: guardedData(asset, data) });
  }
  const asset = await prisma.prop.findFirst({ where: { id: assetId, deletedAt: null } });
  if (!asset) throw new ApiError(404, "PROP_NOT_FOUND", "道具不存在");
  await getProject(asset.projectId);
  return prisma.prop.update({ where: { id: assetId }, data: guardedData(asset, data) });
}

export async function deleteAsset(assetId: string, kind: "location" | "prop") {
  if (kind === "location") {
    const asset = await prisma.location.findFirst({ where: { id: assetId, deletedAt: null }, include: { _count: { select: { scenes: true } } } });
    if (!asset) throw new ApiError(404, "LOCATION_NOT_FOUND", "场景资产不存在");
    await getProject(asset.projectId);
    if (asset._count.scenes > 0) throw new ApiError(409, "LOCATION_IN_USE", "地点已被场景引用，不能直接删除", { sceneCount: asset._count.scenes });
    return prisma.location.update({ where: { id: assetId }, data: { deletedAt: new Date() } });
  }
  const asset = await prisma.prop.findFirst({ where: { id: assetId, deletedAt: null } });
  if (!asset) throw new ApiError(404, "PROP_NOT_FOUND", "道具不存在");
  await getProject(asset.projectId);
  return prisma.prop.update({ where: { id: assetId }, data: { deletedAt: new Date() } });
}

export async function createEpisode(projectId: string, input: unknown) {
  const project = await getProject(projectId);
  const season = project.seasons[0];
  if (!season) throw new ApiError(409, "SEASON_NOT_FOUND", "项目尚未初始化季度");
  const data = episodeSchema.parse(input);
  const order = data.order ?? season.episodes.length + 1;
  return prisma.episode.create({ data: { seasonId: season.id, ...data, order } });
}

export async function updateEpisode(episodeId: string, input: unknown) {
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId, deletedAt: null },
    include: { season: true },
  });
  if (!episode) throw new ApiError(404, "EPISODE_NOT_FOUND", "分集不存在");
  await getProject(episode.season.projectId);
  const patch = episodeSchema.partial().parse(input);
  if (patch.order && patch.order !== episode.order) {
    await reorderEpisodes(episode.seasonId, episode.id, patch.order);
    delete patch.order;
  }
  return prisma.episode.update({
    where: { id: episodeId },
    data: guardedData(episode, patch) as Prisma.EpisodeUpdateInput,
  });
}

async function reorderEpisodes(seasonId: string, episodeId: string, targetOrder: number) {
  const items = await prisma.episode.findMany({ where: { seasonId, deletedAt: null }, orderBy: { order: "asc" } });
  const orderedIds = items.map((item) => item.id).filter((id) => id !== episodeId);
  orderedIds.splice(Math.max(0, Math.min(targetOrder - 1, orderedIds.length)), 0, episodeId);
  await prisma.$transaction([
    ...items.map((item) => prisma.episode.update({ where: { id: item.id }, data: { order: item.order + 10_000 } })),
    ...orderedIds.map((id, index) => prisma.episode.update({ where: { id }, data: { order: index + 1 } })),
  ]);
}

export async function createScene(episodeId: string, input: unknown) {
  await findEpisode(episodeId);
  const data = sceneSchema.parse(input);
  const count = await prisma.scene.count({ where: { episodeId, deletedAt: null } });
  return prisma.scene.create({ data: { episodeId, ...data, order: data.order ?? count + 1 } });
}

export async function updateScene(sceneId: string, input: unknown) {
  const scene = await findScene(sceneId);
  const patch = sceneSchema.partial().parse(input);
  if (patch.order && patch.order !== scene.order) {
    await reorderScenes(scene.episodeId, scene.id, patch.order);
    delete patch.order;
  }
  return prisma.scene.update({
    where: { id: sceneId },
    data: guardedData(scene, patch) as Prisma.SceneUpdateInput,
  });
}

export async function deleteScene(sceneId: string) {
  const scene = await findScene(sceneId);
  const shotCount = await prisma.shot.count({ where: { sceneId, deletedAt: null } });
  if (shotCount > 0) {
    throw new ApiError(409, "SCENE_IN_USE", "场景下已有镜头，不能静默删除", { shotCount });
  }
  await prisma.scene.update({ where: { id: sceneId }, data: { deletedAt: new Date() } });
  await normalizeScenes(scene.episodeId);
}

export async function splitScene(sceneId: string, title: string, firstDuration: number) {
  const scene = await findScene(sceneId);
  if (firstDuration <= 0 || firstDuration >= scene.durationEst) {
    throw new ApiError(400, "INVALID_SPLIT", "拆分时长必须小于原场景时长");
  }
  const siblings = await prisma.scene.findMany({ where: { episodeId: scene.episodeId, deletedAt: null, order: { gt: scene.order } }, orderBy: { order: "desc" } });
  return prisma.$transaction(async (tx) => {
    for (const sibling of siblings) await tx.scene.update({ where: { id: sibling.id }, data: { order: sibling.order + 1 } });
    await tx.scene.update({ where: { id: sceneId }, data: { durationEst: firstDuration } });
    return tx.scene.create({ data: { episodeId: scene.episodeId, order: scene.order + 1, title, timeOfDay: scene.timeOfDay, durationEst: scene.durationEst - firstDuration, locationId: scene.locationId, characterIds: scene.characterIds ?? [], visualDescription: "", actions: [], dialogues: [], narration: "", emotionalGoal: scene.emotionalGoal } });
  });
}

export async function mergeSceneWithNext(sceneId: string) {
  const scene = await findScene(sceneId);
  const next = await prisma.scene.findFirst({ where: { episodeId: scene.episodeId, deletedAt: null, order: scene.order + 1 }, include: { shots: { where: { deletedAt: null } } } });
  if (!next) throw new ApiError(409, "NEXT_SCENE_NOT_FOUND", "没有可合并的下一场景");
  return prisma.$transaction(async (tx) => {
    const movedShots = await tx.shot.findMany({ where: { sceneId: next.id, deletedAt: null } });
    for (const shot of movedShots) await tx.shot.update({ where: { id: shot.id }, data: { sceneId: scene.id } });
    const updated = await tx.scene.update({ where: { id: scene.id }, data: { title: `${scene.title} / ${next.title}`, durationEst: scene.durationEst + next.durationEst, visualDescription: [scene.visualDescription, next.visualDescription].filter(Boolean).join("\n"), actions: [...stringArray(scene.actions), ...stringArray(next.actions)], narration: [scene.narration, next.narration].filter(Boolean).join("\n"), emotionalGoal: [scene.emotionalGoal, next.emotionalGoal].filter(Boolean).join(" → ") } });
    await tx.scene.update({ where: { id: next.id }, data: { deletedAt: new Date() } });
    return updated;
  }).then(async (updated) => { await normalizeScenes(scene.episodeId); return updated; });
}

async function reorderScenes(episodeId: string, sceneId: string, targetOrder: number) {
  const items = await prisma.scene.findMany({ where: { episodeId, deletedAt: null }, orderBy: { order: "asc" } });
  const ids = items.map((item) => item.id).filter((id) => id !== sceneId);
  ids.splice(Math.max(0, Math.min(targetOrder - 1, ids.length)), 0, sceneId);
  await prisma.$transaction([
    ...items.map((item) => prisma.scene.update({ where: { id: item.id }, data: { order: item.order + 10_000 } })),
    ...ids.map((id, index) => prisma.scene.update({ where: { id }, data: { order: index + 1 } })),
  ]);
}

async function normalizeScenes(episodeId: string) {
  const items = await prisma.scene.findMany({ where: { episodeId, deletedAt: null }, orderBy: { order: "asc" } });
  await prisma.$transaction(items.map((item, index) => prisma.scene.update({ where: { id: item.id }, data: { order: index + 1 } })));
}

export async function createShot(episodeId: string, input: unknown) {
  await findEpisode(episodeId);
  const data = shotSchema.parse(input);
  const scene = data.sceneId
    ? await prisma.scene.findFirst({ where: { id: data.sceneId, episodeId, deletedAt: null } })
    : await prisma.scene.findFirst({ where: { episodeId, deletedAt: null }, orderBy: { order: "asc" } });
  if (!scene) throw new ApiError(409, "SCENE_REQUIRED", "请先创建场景，再添加镜头");
  const count = await prisma.shot.count({ where: { scene: { episodeId }, deletedAt: null } });
  const shotData = { ...data };
  delete shotData.sceneId;
  return prisma.shot.create({ data: { sceneId: scene.id, ...shotData, order: data.order ?? count + 1 } });
}

export async function updateShot(shotId: string, input: unknown) {
  const shot = await findShot(shotId);
  const patch = shotSchema.partial().parse(input);
  if (patch.order && patch.order !== shot.order) {
    await reorderShots(shot.scene.episodeId, shot.id, patch.order);
    delete patch.order;
  }
  if (patch.sceneId) {
    const target = await prisma.scene.findFirst({ where: { id: patch.sceneId, episodeId: shot.scene.episodeId, deletedAt: null } });
    if (!target) throw new ApiError(400, "INVALID_SCENE", "目标场景不属于当前分集");
  }
  return prisma.shot.update({
    where: { id: shotId },
    data: guardedData(shot, patch) as Prisma.ShotUpdateInput,
  });
}

export async function deleteShot(shotId: string) {
  const shot = await findShot(shotId);
  await prisma.shot.update({ where: { id: shotId }, data: { deletedAt: new Date() } });
  await normalizeShots(shot.scene.episodeId);
}

export async function splitShot(shotId: string, firstDuration: number) {
  const shot = await findShot(shotId);
  if (firstDuration <= 0 || firstDuration >= shot.durationEst) throw new ApiError(400, "INVALID_SPLIT", "拆分时长必须小于原镜头时长");
  const siblings = await prisma.shot.findMany({ where: { scene: { episodeId: shot.scene.episodeId }, deletedAt: null, order: { gt: shot.order } }, orderBy: { order: "desc" } });
  return prisma.$transaction(async (tx) => {
    for (const sibling of siblings) await tx.shot.update({ where: { id: sibling.id }, data: { order: sibling.order + 1 } });
    await tx.shot.update({ where: { id: shotId }, data: { durationEst: firstDuration } });
    return tx.shot.create({ data: { sceneId: shot.sceneId, order: shot.order + 1, durationEst: shot.durationEst - firstDuration, fields: shot.fields ?? {}, productionStatus: shot.productionStatus } });
  });
}

export async function mergeShotWithNext(shotId: string) {
  const shot = await findShot(shotId);
  const next = await prisma.shot.findFirst({ where: { scene: { episodeId: shot.scene.episodeId }, deletedAt: null, order: shot.order + 1 } });
  if (!next) throw new ApiError(409, "NEXT_SHOT_NOT_FOUND", "没有可合并的下一镜头");
  const fields = typeof shot.fields === "object" && shot.fields && !Array.isArray(shot.fields) ? shot.fields as Prisma.JsonObject : {};
  const nextFields = typeof next.fields === "object" && next.fields && !Array.isArray(next.fields) ? next.fields as Prisma.JsonObject : {};
  const updated = await prisma.$transaction(async (tx) => {
    const merged = await tx.shot.update({ where: { id: shot.id }, data: { durationEst: shot.durationEst + next.durationEst, fields: { ...fields, action: [fields.action, nextFields.action].filter((value) => typeof value === "string" && value).join("；") } } });
    await tx.shot.update({ where: { id: next.id }, data: { deletedAt: new Date() } });
    return merged;
  });
  await normalizeShots(shot.scene.episodeId);
  return updated;
}

async function reorderShots(episodeId: string, shotId: string, targetOrder: number) {
  const items = await prisma.shot.findMany({ where: { scene: { episodeId }, deletedAt: null }, orderBy: { order: "asc" } });
  const ids = items.map((item) => item.id).filter((id) => id !== shotId);
  ids.splice(Math.max(0, Math.min(targetOrder - 1, ids.length)), 0, shotId);
  await prisma.$transaction([
    ...items.map((item) => prisma.shot.update({ where: { id: item.id }, data: { order: item.order + 10_000 } })),
    ...ids.map((id, index) => prisma.shot.update({ where: { id }, data: { order: index + 1 } })),
  ]);
}

async function normalizeShots(episodeId: string) {
  const items = await prisma.shot.findMany({ where: { scene: { episodeId }, deletedAt: null }, orderBy: { order: "asc" } });
  await prisma.$transaction(items.map((item, index) => prisma.shot.update({ where: { id: item.id }, data: { order: index + 1 } })));
}

async function findEpisode(episodeId: string) {
  const episode = await prisma.episode.findFirst({ where: { id: episodeId, deletedAt: null }, include: { season: true } });
  if (!episode) throw new ApiError(404, "EPISODE_NOT_FOUND", "分集不存在");
  await getProject(episode.season.projectId);
  return episode;
}

async function findScene(sceneId: string) {
  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, deletedAt: null },
    include: { episode: { include: { season: true } } },
  });
  if (!scene) throw new ApiError(404, "SCENE_NOT_FOUND", "场景不存在");
  await getProject(scene.episode.season.projectId);
  return scene;
}

async function findShot(shotId: string) {
  const shot = await prisma.shot.findFirst({
    where: { id: shotId, deletedAt: null },
    include: { scene: { include: { episode: { include: { season: true } } } } },
  });
  if (!shot) throw new ApiError(404, "SHOT_NOT_FOUND", "镜头不存在");
  await getProject(shot.scene.episode.season.projectId);
  return shot;
}
