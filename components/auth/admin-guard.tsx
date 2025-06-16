"use client";

import React from "react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  // Show content for all authenticated users
  return <>{children}</>;
}

export default AdminGuard;
