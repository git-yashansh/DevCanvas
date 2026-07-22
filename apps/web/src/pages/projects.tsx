import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectCard, ProjectCardSkeleton, EmptyProjects } from "@/components/dashboard/project-card";
import { Button } from "@ui/index";
import { useProjects } from "@/lib/queries/projects";

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Projects"
        description="All your DevCanvas projects in one place."
        actions={
          <Button variant="gradient" onClick={() => navigate("/app/projects/new")}>
            <Zap className="h-4 w-4" />
            New project
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)
        ) : projects && projects.length > 0 ? (
          projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))
        ) : (
          <div className="col-span-full">
            <EmptyProjects />
          </div>
        )}
      </div>
    </div>
  );
}
