import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GitBranch } from "lucide-react";
import { LandingPage } from "@/pages/landing";
import { SignInPage } from "@/pages/sign-in";
import { SignUpPage } from "@/pages/sign-up";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardHomePage } from "@/pages/dashboard-home";
import { ProjectsPage } from "@/pages/projects";
import { NewProjectPage } from "@/pages/new-project";
import { ProjectDetailPage } from "@/pages/project-detail";
import { ChatPage } from "@/pages/chat";
import { SettingsPage } from "@/pages/settings";
import { ArchitectureGeneratorPage } from "@/pages/architecture-generator";
import { DatabaseDesignerPage } from "@/pages/database-designer";
import { ApiGeneratorPage } from "@/pages/api-generator";
import { SecurityCenterPage } from "@/pages/security-center";
import { SupportPage } from "@/pages/support";
import { GeneratorPlaceholder } from "@/pages/generator-placeholder";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={<NewProjectPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="architecture" element={<ArchitectureGeneratorPage />} />
          <Route path="database" element={<DatabaseDesignerPage />} />
          <Route path="api-generator" element={<ApiGeneratorPage />} />
          <Route path="security" element={<SecurityCenterPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route
            path="repo"
            element={
              <GeneratorPlaceholder
                title="Repository Analyzer"
                description="Connect a repo and get structure, quality metrics, and refactors."
                icon={GitBranch}
                features={[
                  "Folder structure mapping",
                  "Dependency graph",
                  "Code quality metrics",
                  "Refactoring suggestions",
                ]}
              />
            }
          />
        </Route>

        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
