"use client";

import { DashboardNavigation } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user, logout, isAdmin, isManager } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/20 via-background to-accent/20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-primary/40 mx-auto"></div>
          </div>
          <p className="mt-6 text-lg font-medium bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 lg:flex">
      <DashboardNavigation
        userName={user?.name}
        userRole={user?.role}
        isAdmin={isAdmin}
        isManager={isManager}
        onLogout={logout}
      />

      <main className="min-w-0 flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
