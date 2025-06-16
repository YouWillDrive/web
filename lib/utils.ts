import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// DateTime formatting utilities for Russian locale
export function formatDateTime(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "N/A";

  try {
    // Debug: Log the input to understand what we're getting
    console.log("formatDateTime input:", typeof dateInput, dateInput);

    let date: Date;

    if (typeof dateInput === "string") {
      // Handle various SurrealDB date formats
      if (dateInput.includes("T") && !dateInput.endsWith("Z")) {
        // Add Z if missing for proper UTC parsing
        date = new Date(
          dateInput +
            (dateInput.includes("+") || dateInput.includes("-", 19) ? "" : "Z"),
        );
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = dateInput;
    }

    console.log("Parsed date:", date, "Valid:", !isNaN(date.getTime()));

    if (isNaN(date.getTime())) {
      console.warn("Invalid date format:", dateInput);
      return "N/A";
    }

    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Moscow",
    });
  } catch (error) {
    console.warn("DateTime formatting error:", error);
    return "N/A";
  }
}

export function formatRelativeTime(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "N/A";

  try {
    // Debug: Log the input to understand what we're getting
    console.log("formatRelativeTime input:", typeof dateInput, dateInput);

    let date: Date;

    if (typeof dateInput === "string") {
      // Handle various SurrealDB date formats
      if (dateInput.includes("T") && !dateInput.endsWith("Z")) {
        // Add Z if missing for proper UTC parsing
        date = new Date(
          dateInput +
            (dateInput.includes("+") || dateInput.includes("-", 19) ? "" : "Z"),
        );
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = dateInput;
    }

    console.log("Parsed date:", date, "Valid:", !isNaN(date.getTime()));

    if (isNaN(date.getTime())) {
      console.warn("Invalid date format:", dateInput);
      return "N/A";
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) return "только что";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      if (diffInMinutes === 1) return "минуту назад";
      if (diffInMinutes < 5) return `${diffInMinutes} минуты назад`;
      return `${diffInMinutes} минут назад`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      if (diffInHours === 1) return "час назад";
      if (diffInHours < 5) return `${diffInHours} часа назад`;
      return `${diffInHours} часов назад`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      if (diffInDays === 1) return "день назад";
      if (diffInDays < 5) return `${diffInDays} дня назад`;
      return `${diffInDays} дней назад`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      if (diffInWeeks === 1) return "неделю назад";
      return `${diffInWeeks} недели назад`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      if (diffInMonths === 1) return "месяц назад";
      if (diffInMonths < 5) return `${diffInMonths} месяца назад`;
      return `${diffInMonths} месяцев назад`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    if (diffInYears === 1) return "год назад";
    if (diffInYears < 5) return `${diffInYears} года назад`;
    return `${diffInYears} лет назад`;
  } catch (error) {
    console.warn("Relative time formatting error:", error);
    return "N/A";
  }
}

export function formatDate(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "N/A";

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/Moscow",
    });
  } catch (error) {
    return "N/A";
  }
}

export function formatTime(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "N/A";

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    });
  } catch (error) {
    console.warn("Time formatting error:", error);
    return "N/A";
  }
}

// Additional datetime utilities
export function formatShortDate(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "N/A";

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Moscow",
    });
  } catch (error) {
    console.warn("Short date formatting error:", error);
    return "N/A";
  }
}

export function isToday(dateInput: string | Date | null | undefined): boolean {
  if (!dateInput) return false;

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) return false;

    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
}

export function isThisWeek(
  dateInput: string | Date | null | undefined,
): boolean {
  if (!dateInput) return false;

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) return false;

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return date >= weekAgo && date <= today;
  } catch (error) {
    return false;
  }
}

// Helper function for chat time filtering
export function getTimeFilterPredicate(filter: string) {
  const now = new Date();

  switch (filter) {
    case "today":
      return (dateInput: string | Date | null | undefined) =>
        isToday(dateInput);

    case "week":
      return (dateInput: string | Date | null | undefined) =>
        isThisWeek(dateInput);

    case "month":
      return (dateInput: string | Date | null | undefined) => {
        if (!dateInput) return false;
        try {
          const date =
            typeof dateInput === "string" ? new Date(dateInput) : dateInput;
          if (isNaN(date.getTime())) return false;

          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return date >= monthAgo && date <= now;
        } catch {
          return false;
        }
      };

    default:
      return () => true;
  }
}
