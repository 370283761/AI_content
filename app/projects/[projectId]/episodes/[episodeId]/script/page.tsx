import { notFound } from "next/navigation";

import { ProjectShell } from "@/src/components/project-shell";
import { ScriptEditor } from "@/src/components/script-editor";
import { getProject } from "@/src/modules/projects/service";

export const dynamic = "force-dynamic";

export default async function ScriptPage({ params }: { params: Promise<{ projectId: string; episodeId: string }> }) {
  const { projectId, episodeId } = await params;
  const project = await getProject(projectId);
  const episode = project.seasons.flatMap((season) => season.episodes).find((item) => item.id === episodeId);
  if (!episode) notFound();
  const scriptEpisode = {
    id: episode.id,
    title: episode.title,
    targetDuration: episode.targetDuration,
    scenes: episode.scenes.map((scene) => ({
      id: scene.id,
      order: scene.order,
      title: scene.title,
      timeOfDay: scene.timeOfDay,
      durationEst: scene.durationEst,
      visualDescription: scene.visualDescription,
      actions: Array.isArray(scene.actions) ? scene.actions.filter((item): item is string => typeof item === "string") : [],
      dialogues: Array.isArray(scene.dialogues)
        ? scene.dialogues.filter(
            (item): item is { speaker: string; line: string } =>
              typeof item === "object" && item !== null &&
              "speaker" in item && typeof item.speaker === "string" &&
              "line" in item && typeof item.line === "string",
          )
        : [],
      narration: scene.narration,
      emotionalGoal: scene.emotionalGoal,
      shots: scene.shots,
    })),
  };
  return <ProjectShell projectId={projectId} projectName={project.name}><ScriptEditor initialEpisode={scriptEpisode} projectId={projectId} /></ProjectShell>;
}
