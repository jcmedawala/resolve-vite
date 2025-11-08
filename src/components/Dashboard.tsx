"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import DashboardPage from "../app/dashboard/page";
import TeamPage from "../app/team/page";

export function Dashboard() {
  const [currentPage, setCurrentPage] = useState<"dashboard" | "team">("dashboard");

  // Get current user data from Convex
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const canAccessTeam = useQuery(api.team.canAccessTeamPage);

  if (currentUser === undefined || canAccessTeam === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare user data for the sidebar
  const userData = {
    name: currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Admin User',
    email: currentUser?.email || 'admin@example.com',
    avatar: currentUser?.image || '',
  };

  // Handle navigation with access control
  const handleNavigation = (page: "dashboard" | "team") => {
    // Only allow navigation to team page if user has access
    if (page === "team" && !canAccessTeam) {
      return;
    }
    setCurrentPage(page);
  };

  return (
    <SidebarProvider>
      <AppSidebar
        user={userData}
        canAccessTeam={canAccessTeam}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />
      <SidebarInset>
        <SiteHeader userRole={currentUser?.role} />
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {currentPage === "dashboard" ? <DashboardPage /> : <TeamPage />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
