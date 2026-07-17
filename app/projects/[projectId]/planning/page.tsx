import { PlanningEditor } from "@/src/components/planning-editor";
import { ProjectShell } from "@/src/components/project-shell";
import { getProject } from "@/src/modules/projects/service";

export const dynamic = "force-dynamic";

export default async function PlanningPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  return <ProjectShell projectId={projectId} projectName={project.name}><PlanningEditor initialEpisodes={project.seasons[0]?.episodes ?? []} projectId={projectId} /></ProjectShell>;
}
