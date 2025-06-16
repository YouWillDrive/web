"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  User,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useCalendarEvents } from "@/lib/api/hooks";
import { ErrorState } from "@/components/ui/api-states";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventDetailsModal } from "@/components/calendar";

// --- Data Types ---
interface Participant {
  id: string;
  name: string;
  surname: string;
  patronymic: string;
}

interface EventType {
  id: string;
  name: string;
}

interface Event {
  id: string;
  date: Date;
  eventType: EventType;
  cadet?: Participant;
  instructor?: Participant;
}

// --- Main Component ---
export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const { data: apiEvents, loading, error, refetch } = useCalendarEvents();

  const events: Event[] = useMemo(() => {
    if (!apiEvents) return [];
    // Ensure event.date is valid before creating a Date object
    return apiEvents.map((event) => ({
      ...event,
      date: new Date(event.date),
    }));
  }, [apiEvents]);

  const handleDayClick = useCallback(
    (day: number) => {
      setSelectedDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
      );
    },
    [currentDate],
  );

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  }, []);

  const closeEventModal = useCallback(() => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const displayedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter((event) => {
        const eventDate = event.date;
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedDate, events]);

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const monthName = currentDate.toLocaleDateString("ru", { month: "long" });
  const year = currentDate.getFullYear();

  if (error) {
    return (
      <div className="container mx-auto flex h-full items-center justify-center px-4 py-8">
        <ErrorState error={error} onRetry={refetch} variant="card" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-2">
          {/* Header */}
          {user?.role === "instructor" && (
            <div className="flex justify-end items-center mb-4">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Новое событие
              </Button>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-80px)]">
            {/* Calendar Section */}
            <div className="lg:col-span-2 space-y-3">
              {/* Month Navigation */}
              <Card className="shadow-md">
                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize text-xl">
                      {monthName} {year}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Calendar Grid */}
              <CalendarGrid
                currentDate={currentDate}
                events={events}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
                loading={loading}
              />
            </div>

            {/* Events Sidebar */}
            <div className="lg:col-span-1">
              <EventsSidebar
                selectedDate={selectedDate}
                events={displayedEvents}
                myRole={user?.role}
                onEventClick={handleEventClick}
              />
            </div>
          </div>
        </div>

        {/* Event Details Modal */}
        <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Детали события</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <EventDetailsModal
                event={selectedEvent}
                onClose={closeEventModal}
                userRole={user?.role}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}

// --- Calendar Grid Component ---
function CalendarGrid({
  currentDate,
  events,
  selectedDate,
  onDayClick,
  loading,
}: {
  currentDate: Date;
  events: Event[];
  selectedDate: Date | null;
  onDayClick: (day: number) => void;
  loading: boolean;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const getEventsForDay = useCallback(
    (day: number) => {
      return events.filter((event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === day &&
          eventDate.getMonth() === month &&
          eventDate.getFullYear() === year
        );
      });
    },
    [events, month, year],
  );

  const eventTypeColors: Record<string, string> = {
    "event_types:lesson": "bg-blue-500",
    "event_types:sai_exam": "bg-green-500",
    "event_types:sai_lesson": "bg-purple-500",
    "event_types:school_exam": "bg-orange-500",
  };

  return (
    <Card className="shadow-md flex-1">
      <CardContent className="p-3">
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map((day, i) => (
              <div
                key={i}
                className="h-6 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Empty cells */}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14"></div>
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayEvents = getEventsForDay(day);
              const isSelected =
                selectedDate?.getDate() === day &&
                selectedDate?.getMonth() === month &&
                selectedDate?.getFullYear() === year;
              const isToday =
                today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year;

              return (
                <div
                  key={day}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    "h-14 rounded-md p-1.5 border cursor-pointer transition-all hover:shadow-sm",
                    "flex flex-col justify-between relative",
                    isSelected
                      ? "bg-primary/20 border-primary shadow-md"
                      : isToday
                        ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700"
                        : "bg-card hover:bg-muted/30 border-muted",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isSelected
                        ? "text-primary"
                        : isToday
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-foreground",
                    )}
                  >
                    {day}
                  </span>

                  {/* Event indicators */}
                  {dayEvents.length > 0 && (
                    <div className="flex justify-center items-center gap-1 mt-1">
                      {dayEvents.slice(0, 4).map((event, idx) => (
                        <div
                          key={event.id}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            eventTypeColors[event.eventType.id] ||
                              "bg-gray-400",
                          )}
                        />
                      ))}
                      {dayEvents.length > 4 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          +{dayEvents.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Events Sidebar Component ---
function EventsSidebar({
  selectedDate,
  events,
  myRole,
  onEventClick,
}: {
  selectedDate: Date | null;
  events: Event[];
  myRole?: string;
  onEventClick?: (event: Event) => void;
}) {
  const monthNames = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];

  const title = selectedDate
    ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`
    : "Выберите день";

  const eventTypeColors: Record<string, string> = {
    "event_types:lesson": "border-l-blue-500",
    "event_types:sai_exam": "border-l-green-500",
    "event_types:sai_lesson": "border-l-purple-500",
    "event_types:school_exam": "border-l-orange-500",
  };

  return (
    <Card className="shadow-md h-fit max-h-full">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {events.length === 0 ? (
          <div className="text-center py-6">
            <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">Событий нет</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((event) => {
              const timeFormatter = new Intl.DateTimeFormat("ru", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const formattedTime = timeFormatter.format(event.date);

              const participant =
                myRole === "cadet" ? event.instructor : event.cadet;
              const participantName = participant
                ? `${participant.surname} ${participant.name}`
                : "Участник не указан";

              return (
                <Card
                  key={event.id}
                  className={cn(
                    "border-l-4 hover:shadow-sm transition-shadow cursor-pointer hover:bg-muted/30",
                    eventTypeColors[event.eventType.id] || "border-l-gray-400",
                  )}
                  onClick={() => onEventClick?.(event)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs truncate">
                          {event.eventType.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {participantName}
                        </p>
                      </div>
                      <div className="text-xs font-medium text-right">
                        {formattedTime}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
