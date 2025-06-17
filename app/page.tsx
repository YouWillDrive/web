"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import {
  LogOut,
  Phone,
  User,
  Users,
  MessageSquare,
  ShieldCheck,
  Shield,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function Home() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AuthGuard>
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-full">
        <div className="container mx-auto px-4 py-8">
          {/* Header with logout */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Главная</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Добро пожаловать, {user?.name}!
            </h2>
            <div className="flex items-center justify-center mb-2">
              <Badge
                variant={
                  user?.role === "admin"
                    ? "destructive"
                    : user?.role === "instructor"
                      ? "default"
                      : "secondary"
                }
                className="text-xs px-3 py-1"
              >
                {user?.role === "admin" ? (
                  <ShieldCheck className="size-3" />
                ) : (
                  <Shield className="size-3" />
                )}
                {user?.role === "admin"
                  ? "Администратор"
                  : user?.role === "instructor"
                    ? "Инструктор"
                    : "Курсант"}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              Ваш надежный спутник в мире вождения
            </p>
          </div>

          <div className="max-w-xl mx-auto flex flex-col space-y-8">
            <h2 className="text-xl font-medium text-center mb-2">
              Выберите раздел
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <Link href="/users" className="w-full">
                <Button
                  className="w-full h-32 text-xl font-medium flex flex-col gap-3 items-center justify-center shadow-md hover:shadow-lg transition-all"
                  variant="outline"
                  size="lg"
                >
                  <Users className="h-10 w-10" />
                  Пользователи
                </Button>
              </Link>

              <Link href="/chats" className="w-full">
                <Button
                  className="w-full h-32 text-xl font-medium flex flex-col gap-3 items-center justify-center shadow-md hover:shadow-lg transition-all"
                  variant="outline"
                  size="lg"
                >
                  <MessageSquare className="h-10 w-10" />
                  Чаты
                </Button>
              </Link>

              <Link href="/calendar" className="w-full">
                <Button
                  className="w-full h-32 text-xl font-medium flex flex-col gap-3 items-center justify-center shadow-md hover:shadow-lg transition-all"
                  variant="outline"
                  size="lg"
                >
                  <Calendar className="h-10 w-10" />
                  Календарь
                </Button>
              </Link>
            </div>

            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all">
              <CardHeader className="text-center">
                <CardTitle>Профиль пользователя</CardTitle>
                <CardDescription>Информация вашего аккаунта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Имя пользователя
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{user?.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      Номер телефона
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">
                      {user?.role === "admin"
                        ? "Администратор"
                        : user?.role === "instructor"
                          ? "Инструктор"
                          : "Курсант"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Роль в системе
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
