"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    // If not logged in or already admin, redirect to appropriate page
    if (!user) {
      router.push("/login");
    } else if (user.role === "admin") {
      router.push("/");
    }
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user || user.role === "admin") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 mx-auto mb-6 flex items-center justify-center">
          <ShieldAlert className="size-10" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          Доступ запрещен
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Эта система доступна только для администраторов. Пожалуйста, свяжитесь
          с администратором, если считаете, что это ошибка.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center gap-3 w-full max-w-sm mx-auto">
            <AlertCircle className="size-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-300 text-left">
              Ваша роль: <span className="font-medium">{user?.role}</span>
            </p>
          </div>

          <Button
            onClick={handleLogout}
            className="w-full max-w-sm mt-2"
            variant="destructive"
          >
            Выйти из системы
          </Button>
        </div>
      </div>
    </div>
  );
}
