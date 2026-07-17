-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('idea', 'pasted', 'novel_generated');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'pending', 'confirmed', 'locked');

-- CreateEnum
CREATE TYPE "CharacterRole" AS ENUM ('protagonist', 'antagonist', 'supporting');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('todo', 'submitted', 'generated', 'adopted', 'needs_work', 'discarded');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "genre" VARCHAR(80) NOT NULL DEFAULT '动漫短剧',
    "source_kind" "SourceKind" NOT NULL,
    "params" JSONB NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "quota_used" BIGINT NOT NULL DEFAULT 0,
    "quota_limit" BIGINT NOT NULL DEFAULT 1073741824,
    "last_stage" VARCHAR(50) NOT NULL DEFAULT 'setup',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_documents" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "title" VARCHAR(200),
    "content" TEXT NOT NULL,
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_bibles" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "logline" TEXT NOT NULL DEFAULT '',
    "theme" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL DEFAULT '',
    "worldbuilding" TEXT NOT NULL DEFAULT '',
    "core_conflict" TEXT NOT NULL DEFAULT '',
    "main_goal" TEXT NOT NULL DEFAULT '',
    "immutable_facts" JSONB NOT NULL DEFAULT '[]',
    "field_sources" JSONB NOT NULL DEFAULT '{}',
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_bibles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "age" VARCHAR(40),
    "identity" TEXT NOT NULL DEFAULT '',
    "role" "CharacterRole" NOT NULL DEFAULT 'supporting',
    "personality" TEXT NOT NULL DEFAULT '',
    "goal" TEXT NOT NULL DEFAULT '',
    "appearance" JSONB NOT NULL DEFAULT '{}',
    "costumes" JSONB NOT NULL DEFAULT '[]',
    "iconic_items" JSONB NOT NULL DEFAULT '[]',
    "forbidden_changes" JSONB NOT NULL DEFAULT '[]',
    "visual_prompt" TEXT NOT NULL DEFAULT '',
    "field_sources" JSONB NOT NULL DEFAULT '{}',
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "from_id" UUID NOT NULL,
    "to_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 50,
    "trajectory" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "visual_prompt" TEXT NOT NULL DEFAULT '',
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "props" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "visual_prompt" TEXT NOT NULL DEFAULT '',
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "props_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_profiles" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "template_name" VARCHAR(120) NOT NULL DEFAULT '二次元赛璐璐',
    "texture" TEXT NOT NULL DEFAULT '',
    "color_lighting" TEXT NOT NULL DEFAULT '',
    "composition" TEXT NOT NULL DEFAULT '',
    "aspect_ratio" VARCHAR(20) NOT NULL DEFAULT '9:16',
    "negative_prompt" TEXT NOT NULL DEFAULT '',
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(200) NOT NULL DEFAULT '第一季',
    "arc" TEXT NOT NULL DEFAULT '',
    "character_growth" JSONB NOT NULL DEFAULT '[]',
    "foreshadowings" JSONB NOT NULL DEFAULT '[]',
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "hook" TEXT NOT NULL DEFAULT '',
    "goal" TEXT NOT NULL DEFAULT '',
    "conflict" TEXT NOT NULL DEFAULT '',
    "main_plot" TEXT NOT NULL DEFAULT '',
    "cliffhanger" TEXT NOT NULL DEFAULT '',
    "target_duration" INTEGER NOT NULL DEFAULT 60,
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes" (
    "id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "location_id" UUID,
    "order" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "time_of_day" VARCHAR(80) NOT NULL DEFAULT '',
    "duration_est" INTEGER NOT NULL DEFAULT 0,
    "character_ids" JSONB NOT NULL DEFAULT '[]',
    "visual_description" TEXT NOT NULL DEFAULT '',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "dialogues" JSONB NOT NULL DEFAULT '[]',
    "narration" TEXT NOT NULL DEFAULT '',
    "emotional_goal" TEXT NOT NULL DEFAULT '',
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shots" (
    "id" UUID NOT NULL,
    "scene_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "duration_est" INTEGER NOT NULL DEFAULT 4,
    "fields" JSONB NOT NULL,
    "production_status" "ProductionStatus" NOT NULL DEFAULT 'todo',
    "content_status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locked_fields" JSONB NOT NULL DEFAULT '[]',
    "current_prompt_id" UUID,
    "submitted_prompt_version_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "entity_type" VARCHAR(30) NOT NULL,
    "entity_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "parent_id" UUID,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "source" VARCHAR(20) NOT NULL,
    "ai_task_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_workspace_id_idx" ON "users"("workspace_id");

-- CreateIndex
CREATE INDEX "projects_workspace_id_status_idx" ON "projects"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "projects_owner_id_status_idx" ON "projects"("owner_id", "status");

-- CreateIndex
CREATE INDEX "source_documents_project_id_idx" ON "source_documents"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_bibles_project_id_key" ON "story_bibles"("project_id");

-- CreateIndex
CREATE INDEX "characters_project_id_idx" ON "characters"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "characters_project_id_name_key" ON "characters"("project_id", "name");

-- CreateIndex
CREATE INDEX "relationships_project_id_idx" ON "relationships"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "relationships_from_id_to_id_type_key" ON "relationships"("from_id", "to_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "locations_project_id_name_key" ON "locations"("project_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "props_project_id_name_key" ON "props"("project_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "style_profiles_project_id_key" ON "style_profiles"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_project_id_order_key" ON "seasons"("project_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_season_id_order_key" ON "episodes"("season_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "scenes_episode_id_order_key" ON "scenes"("episode_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "shots_scene_id_order_key" ON "shots"("scene_id", "order");

-- CreateIndex
CREATE INDEX "content_versions_project_id_idx" ON "content_versions"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_entity_type_entity_id_version_no_key" ON "content_versions"("entity_type", "entity_id", "version_no");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_bibles" ADD CONSTRAINT "story_bibles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "props" ADD CONSTRAINT "props_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_profiles" ADD CONSTRAINT "style_profiles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
