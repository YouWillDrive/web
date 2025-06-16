"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, RefreshCw, WifiOff, ServerCrash } from "lucide-react";

interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function LoadingState({
  size = "md",
  message = "Загрузка...",
  className = ""
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "min-h-[200px]",
    md: "min-h-[300px]",
    lg: "min-h-[400px]"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}>
      <Spinner size={size} />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: "default" | "card";
}

export function ErrorState({
  error,
  onRetry,
  retryLabel = "Попробовать снова",
  className = "",
  variant = "default"
}: ErrorStateProps) {
  const getErrorIcon = (error: string) => {
    if (error.toLowerCase().includes("сеть") || error.toLowerCase().includes("network")) {
      return <WifiOff className="h-12 w-12 text-destructive/60" />;
    }
    if (error.toLowerCase().includes("сервер") || error.toLowerCase().includes("server")) {
      return <ServerCrash className="h-12 w-12 text-destructive/60" />;
    }
    return <AlertCircle className="h-12 w-12 text-destructive/60" />;
  };

  const content = (
    <div className={`text-center py-8 ${className}`}>
      <div className="flex justify-center mb-4">
        {getErrorIcon(error)}
      </div>
      <h3 className="text-lg font-medium text-destructive mb-2">
        Ошибка загрузки данных
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
        {error}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ApiStateWrapperProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function ApiStateWrapper({
  loading,
  error,
  onRetry,
  loadingMessage,
  children,
  className = ""
}: ApiStateWrapperProps) {
  if (loading) {
    return <LoadingState message={loadingMessage} className={className} />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        className={className}
        variant="card"
      />
    );
  }

  return <>{children}</>;
}

interface DataStateProps<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  children: (data: T[]) => React.ReactNode;
  className?: string;
}

export function DataState<T>({
  data,
  loading,
  error,
  onRetry,
  emptyState,
  children,
  className = ""
}: DataStateProps<T>) {
  if (loading) {
    return <LoadingState className={className} />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        className={className}
        variant="card"
      />
    );
  }

  if (!data || data.length === 0) {
    if (emptyState) {
      return <EmptyState {...emptyState} className={className} />;
    }
    return (
      <EmptyState
        title="Нет данных"
        description="Данные не найдены или еще не загружены"
        className={className}
      />
    );
  }

  return <>{children(data)}</>;
}
