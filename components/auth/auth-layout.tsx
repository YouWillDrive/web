"use client";

import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Simple layout component that just passes through its children
 * We rely on AuthGuard to handle authentication and role checking
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  // Just pass through the children - AuthGuard will handle restrictions
  return <>{children}</>;
}

export default AuthLayout;
