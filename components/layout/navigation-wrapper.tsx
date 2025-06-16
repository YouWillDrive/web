"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/ui/navigation";
export function NavigationWrapper() {
  const pathname = usePathname();
  const isLoginPage = pathname.includes("/login");
  const isAccessDeniedPage = pathname.includes("/access-denied");

  // Hide navigation on login and access denied pages
  if (isLoginPage || isAccessDeniedPage) {
    return null;
  }

  return <Navigation />;
}

export default NavigationWrapper;
