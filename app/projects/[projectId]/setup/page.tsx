import { ProjectShell } from "@/src/components/project-shell";
import { SetupEditor } from "@/src/components/setup-editor";
import { getProject } from "@/src/modules/projects/service";

export const dynamic = "force-dynamic";

export default async function SetupPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  return <ProjectShell projectId={projectId} projectName={project.name}><SetupEditor projectId={projectId} /></ProjectShell>;
}
