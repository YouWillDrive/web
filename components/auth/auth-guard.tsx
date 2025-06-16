"use client";

import { useAuth } from "@/contexts/auth-context";
import { Logo } from "@/components/brand/logo";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Move the conditional redirect logic to the top-level useEffect
  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      router.push("/access-denied");
    }
  }, [user, loading, router]);

  // Handle authentication redirects

  if (loading) {
    return (
      fallback || (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="text-center space-y-6">
            <Logo size="lg" className="justify-center" />
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-muted-foreground">Загрузка...</span>
            </div>
          </div>
        </div>
      )
    );
  }

  if (!user) {
    // Will redirect to login in useEffect
    return null;
  }

  // Check if user is admin, if not show loading indicator while redirecting
  if (user.role !== "admin") {
    // Show loading indicator while redirecting
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Перенаправление...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
