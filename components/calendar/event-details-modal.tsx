"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  User,
  Calendar,
  MapPin,
  Phone,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDateTime, formatTime } from "@/lib/utils";

// Event type interface matching the one from calendar page
interface EventType {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  surname: string;
  patronymic: string;
}

interface Event {
  id: string;
  date: Date;
  eventType: EventType;
  cadet?: Participant;
  instructor?: Participant;
}

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  userRole?: string;
}

export function EventDetailsModal({
  event,
  onClose,
  onEdit,
  onDelete,
  userRole,
}: EventDetailsModalProps) {
  const getEventTypeColor = (eventTypeId: string) => {
    switch (eventTypeId) {
      case "event_types:lesson":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-300 dark:border-blue-700";
      case "event_types:sai_exam":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-700";
      case "event_types:sai_lesson":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-300 dark:border-purple-700";
      case "event_types:school_exam":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-300 dark:border-orange-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300 dark:border-gray-700";
    }
  };

  const formatParticipantName = (participant?: Participant) => {
    if (!participant) return "Не указан";
    return `${participant.surname} ${participant.name} ${participant.patronymic || ""}`.trim();
  };

  const getParticipantRole = (participant?: Participant) => {
    // This is a simplified role detection - in a real app you'd get this from the participant data
    return participant === event.cadet ? "Курсант" : "Инструктор";
  };

  const formatEventDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const eventDateString = date.toDateString();
    const todayString = today.toDateString();
    const tomorrowString = tomorrow.toDateString();
    const yesterdayString = yesterday.toDateString();

    if (eventDateString === todayString) {
      return "Сегодня";
    } else if (eventDateString === tomorrowString) {
      return "Завтра";
    } else if (eventDateString === yesterdayString) {
      return "Вчера";
    } else {
      return date.toLocaleDateString("ru", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  const isEditable = userRole === "admin" || userRole === "instructor";

  return (
    <div className="space-y-6">
      {/* Header with close button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{event.eventType.name}</h3>
            <p className="text-sm text-muted-foreground">
              ID: {event.id.split(":")[1] || event.id}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Event Type Badge */}
      <div className="flex justify-center">
        <Badge
          variant="secondary"
          className={`${getEventTypeColor(event.eventType.id)} px-3 py-1`}
        >
          {event.eventType.name}
        </Badge>
      </div>

      <Separator />

      {/* Date and Time */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{formatEventDate(event.date)}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(event.date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{formatTime(event.date)}</p>
            <p className="text-sm text-muted-foreground">
              Время проведения события
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Participants */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Участники
        </h4>

        {/* Cadet */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {formatParticipantName(event.cadet)}
              </p>
              <Badge variant="outline" className="text-xs">
                Курсант
              </Badge>
            </div>
            {event.cadet && (
              <p className="text-sm text-muted-foreground">
                ID: {event.cadet.id.split(":")[1] || event.cadet.id}
              </p>
            )}
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <User className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {formatParticipantName(event.instructor)}
              </p>
              <Badge variant="outline" className="text-xs">
                Инструктор
              </Badge>
            </div>
            {event.instructor && (
              <p className="text-sm text-muted-foreground">
                ID: {event.instructor.id.split(":")[1] || event.instructor.id}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditable && (onEdit || onDelete) && (
        <>
          <Separator />
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(event)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(event)}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            )}
          </div>
        </>
      )}

      {/* Event Details Info */}
      <div className="bg-muted/20 rounded-lg p-4">
        <h5 className="font-medium mb-2 text-sm">Информация о событии</h5>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Тип события:</span>
            <span className="font-medium">{event.eventType.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Дата создания:</span>
            <span>{formatDateTime(event.date)}</span>
          </div>
          <div className="flex justify-between">
            <span>Статус:</span>
            <Badge variant="secondary" className="text-xs">
              {new Date() > event.date ? "Завершено" : "Запланировано"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
