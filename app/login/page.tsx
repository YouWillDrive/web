"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertCircle, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    password?: string;
    general?: string;
  }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const validateForm = () => {
    const newErrors: { phone?: string; password?: string } = {};

    if (!phone) {
      newErrors.phone = t("errors.phoneRequired");
    } else if (
      !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ""))
    ) {
      newErrors.phone = t("errors.phoneInvalid");
    }

    if (!password) {
      newErrors.password = t("errors.passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = t("errors.passwordTooShort");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(phone, password);

      if (result.success) {
        // Redirect will happen via useEffect when user state updates
        router.push("/");
      } else {
        setErrors({ general: result.error || "Ошибка входа в систему" });
      }
    } catch {
      setErrors({ general: "Ошибка подключения к серверу" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      <div className="w-full max-w-md space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        <div className="sr-only">
          <h1>Страница входа в YouWillDrive</h1>
        </div>
        {/* Logo Section */}
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-4" />
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold">
              {t("welcomeBack")}
            </CardTitle>
            <CardDescription>{t("loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {errors.general}
                </div>
              )}

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t("phone")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  className={`h-11 transition-all duration-200 focus:scale-[1.02] ${
                    errors.phone
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }`}
                />
                {errors.phone && (
                  <div
                    id="phone-error"
                    className="flex items-center gap-2 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`h-11 pr-10 transition-all duration-200 focus:scale-[1.02] ${
                      errors.password
                        ? "border-destructive focus-visible:ring-destructive/20"
                        : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Скрыть пароль" : "Показать пароль"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <div
                    id="password-error"
                    className="flex items-center gap-2 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-11 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" className="border-primary-foreground" />
                    Вход...
                  </div>
                ) : (
                  t("loginButton")
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="w-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">
                  Только администраторы имеют доступ к системе. Если у вас нет
                  прав администратора, вы увидите сообщение об ограниченном
                  доступе.
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground animate-in fade-in-50 delay-300">
          <p>© 2024 YouWillDrive. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
