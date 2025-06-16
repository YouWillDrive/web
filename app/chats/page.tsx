"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  MessageSquare,
  Users,
  Calendar,
  Eye,
  Clock,
  User,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Chat } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";
import { DataState } from "@/components/ui/api-states";
import { useChats } from "@/lib/api/hooks";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { ChatViewerDialog } from "@/components/chats/chat-viewer-dialog";

interface ChatData {
  id: string;
  cadetName: string;
  instructorName: string;
  lastMessage: string;
  lastMessageTime: string | Date | null;
  messageCount: number;
  lastActivity: string | Date | null;
  cadetPhone: string;
  instructorPhone: string;
}

export default function ChatsPage() {
  const { data: chats, loading, error, refetch } = useChats();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  // Filter and search chats
  const filteredChats = useMemo(() => {
    if (!chats) return [];
    return chats.filter((chat) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText =
          `${chat.cadetName} ${chat.instructorName} ${chat.cadetPhone} ${chat.instructorPhone}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Time filter
      if (timeFilter !== "all") {
        if (!chat.lastActivity) return false;

        const lastActivityDate =
          typeof chat.lastActivity === "string"
            ? new Date(chat.lastActivity)
            : chat.lastActivity;

        if (isNaN(lastActivityDate.getTime())) return false;

        const now = new Date();
        const diffInMs = now.getTime() - lastActivityDate.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        const diffInDays = diffInHours / 24;

        switch (timeFilter) {
          case "today":
            if (diffInHours > 24) return false;
            break;
          case "week":
            if (diffInDays > 7) return false;
            break;
          case "month":
            if (diffInDays > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [chats, searchQuery, timeFilter]);

  // Performance optimization: Get unique participant count
  const uniqueParticipantCount = useMemo(() => {
    if (!chats) return 0;
    const participants = new Set([
      ...chats.map((c) => c.cadetName),
      ...chats.map((c) => c.instructorName),
    ]);
    return participants.size;
  }, [chats]);

  // Get total message count
  const totalMessageCount = useMemo(() => {
    return chats?.reduce((sum, chat) => sum + chat.messageCount, 0) || 0;
  }, [chats]);

  return (
    <AuthGuard>
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-full">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Мониторинг чатов
              </h1>
              <p className="text-muted-foreground mt-1">
                Просмотр переписки между курсантами и инструкторами
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Фильтры и поиск</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени курсанта, инструктора или номеру телефона..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Time Filter */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все время</SelectItem>
                      <SelectItem value="today">Сегодня</SelectItem>
                      <SelectItem value="week">Эта неделя</SelectItem>
                      <SelectItem value="month">Этот месяц</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{chats?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Всего чатов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {uniqueParticipantCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Участников</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalMessageCount}</p>
                    <p className="text-xs text-muted-foreground">Сообщений</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{filteredChats.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Отфильтровано
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Summary */}
          {chats && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Показано {filteredChats.length} из {chats.length} чатов
                {(searchQuery || timeFilter !== "all") && " по вашему запросу"}
              </p>
            </div>
          )}

          {/* Chats List */}
          <DataState
            data={chats}
            loading={loading}
            error={error}
            onRetry={refetch}
            emptyState={{
              icon: (
                <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50" />
              ),
              title: "Чаты не найдены",
              description:
                searchQuery || timeFilter !== "all"
                  ? "Попробуйте изменить параметры поиска или фильтра"
                  : "Пока нет чатов в системе",
            }}
          >
            {(chatsData) => (
              <>
                {filteredChats.length === 0 ? (
                  <Card className="shadow-md">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        Чаты не найдены
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Попробуйте изменить параметры поиска или фильтра
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredChats.map((chat) => (
                      <Card
                        key={chat.id}
                        className="shadow-md hover:shadow-lg transition-all border-l-4 border-l-primary/20 hover:border-l-primary"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            {/* Chat Info */}
                            <div className="flex-1 min-w-0">
                              {/* Participants */}
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {chat.cadetName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Курсант
                                    </p>
                                  </div>
                                </div>

                                <div className="text-muted-foreground">⟷</div>

                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {chat.instructorName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Инструктор
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Last Message */}
                              <div className="mb-3">
                                <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                                  <span className="text-muted-foreground text-xs">
                                    Последнее сообщение:
                                  </span>{" "}
                                  {chat.lastMessage}
                                </p>
                              </div>

                              {/* Chat Stats */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  {chat.messageCount}{" "}
                                  {chat.messageCount === 1
                                    ? "сообщение"
                                    : chat.messageCount < 5
                                      ? "сообщения"
                                      : "сообщений"}
                                </span>
                                <span>•</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">
                                        {formatRelativeTime(chat.lastActivity)}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        Точное время:{" "}
                                        {formatDateTime(chat.lastMessageTime)}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>

                            {/* Right Side Info */}
                            <div className="flex flex-col items-end gap-2 text-right">
                              <ChatViewerDialog
                                chat={chat}
                                variant="outline"
                                size="sm"
                              />
                              <div className="text-xs text-muted-foreground">
                                ID: {chat.id.split(":")[1] || chat.id}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </DataState>
        </div>
      </div>
    </AuthGuard>
  );
}
