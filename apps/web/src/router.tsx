import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { RepoAnalyzerPage } from "@/pages/repo-analyzer";
import { DocumentationGeneratorPage } from "@/pages/documentation-generator";
import { DeploymentGeneratorPage } from "@/pages/deployment-generator";
import { SupportPage } from "@/pages/support";
import { GeneratorPlaceholder } from "@/pages/generator-placeholder";

// Admin Imports
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboardPage } from "@/pages/admin/dashboard";
import { AdminUsersPage } from "@/pages/admin/users";
import { AdminUserDetailsPage } from "@/pages/admin/user-details";
import { AdminTicketsPage } from "@/pages/admin/tickets";
import { AdminAnalyticsPage } from "@/pages/admin/analytics";
import { AdminProjectsPage } from "@/pages/admin/projects";
import { AdminAiOperationsPage } from "@/pages/admin/ai";
import { AdminSystemMonitoringPage } from "@/pages/admin/system";
import { AdminSecurityPage } from "@/pages/admin/security";
import { AdminNotificationsPage } from "@/pages/admin/notifications";
import { AdminFeedbackPage } from "@/pages/admin/feedback";
import { AdminAuditLogsPage } from "@/pages/admin/audit";
import { AdminSettingsPage } from "@/pages/admin/settings";

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
          <Route path="repo" element={<RepoAnalyzerPage />} />
          <Route path="documentation" element={<DocumentationGeneratorPage />} />
          <Route path="deployment" element={<DeploymentGeneratorPage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>

        {/* Operational Control Center (Admin Panel) Routes */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailsPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="ai" element={<AdminAiOperationsPage />} />
          <Route path="system" element={<AdminSystemMonitoringPage />} />
          <Route path="security" element={<AdminSecurityPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="audit" element={<AdminAuditLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
