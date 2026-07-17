import { notFound } from "next/navigation";

import { ProductionWorkbench } from "@/src/components/production-workbench";
import { ProjectShell } from "@/src/components/project-shell";
import { shotFieldsSchema } from "@/src/modules/content/schemas";
import { getProject } from "@/src/modules/projects/service";

export const dynamic = "force-dynamic";

export default async function ProductionPage({ params }: { params: Promise<{ projectId: string; episodeId: string }> }) {
  const { projectId, episodeId } = await params;
  const project = await getProject(projectId);
  const episode = project.seasons.flatMap((season)=>season.episodes).find((item)=>item.id===episodeId);
  if (!episode) notFound();
  const shots = episode.scenes.flatMap((scene)=>scene.shots).sort((a,b)=>a.order-b.order).map((shot) => ({
    id: shot.id,
    order: shot.order,
    durationEst: shot.durationEst,
    productionStatus: shot.productionStatus,
    fields: shotFieldsSchema.parse(shot.fields),
  }));
  return <ProjectShell projectId={projectId} projectName={project.name}><ProductionWorkbench episodeId={episodeId} projectId={projectId} shots={shots} title={episode.title}/></ProjectShell>;
}
