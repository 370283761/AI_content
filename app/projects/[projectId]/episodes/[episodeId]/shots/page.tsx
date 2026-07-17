import { notFound } from "next/navigation";

import { ProjectShell } from "@/src/components/project-shell";
import { ShotsEditor } from "@/src/components/shots-editor";
import { shotFieldsSchema } from "@/src/modules/content/schemas";
import { getProject } from "@/src/modules/projects/service";

export const dynamic = "force-dynamic";

export default async function ShotsPage({ params }: { params: Promise<{ projectId: string; episodeId: string }> }) {
  const { projectId, episodeId } = await params;
  const project = await getProject(projectId);
  const episode = project.seasons.flatMap((season) => season.episodes).find((item) => item.id === episodeId);
  if (!episode) notFound();
  const scenes = episode.scenes.map((scene) => ({ id: scene.id, order: scene.order, title: scene.title }));
  const shots = episode.scenes.flatMap((scene) => scene.shots.map((shot) => ({
    id: shot.id,
    order: shot.order,
    sceneId: shot.sceneId,
    durationEst: shot.durationEst,
    fields: shotFieldsSchema.parse(shot.fields),
    scene: { id: scene.id, order: scene.order, title: scene.title },
  }))).sort((a,b)=>a.order-b.order);
  return <ProjectShell projectId={projectId} projectName={project.name}><ShotsEditor episode={{ id: episode.id, title: episode.title, targetDuration: episode.targetDuration, scenes }} initialShots={shots} projectId={projectId} /></ProjectShell>;
}
