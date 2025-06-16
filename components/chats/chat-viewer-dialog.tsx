"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  Search,
  Filter,
  MessageSquare,
  User,
  Clock,
  X,
  Download,
  Copy,
  ChevronDown,
} from "lucide-react";
import { Chat, ChatMessage } from "@/lib/api/client";
import { useChatMessages } from "@/lib/api/hooks";
import { DataState } from "@/components/ui/api-states";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ChatViewerDialogProps {
  chat: Chat;
  trigger?: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "sm" | "default" | "lg";
}

interface FilteredMessage extends ChatMessage {
  isHighlighted?: boolean;
  highlightedText?: string;
}

export function ChatViewerDialog({
  chat,
  trigger,
  variant = "outline",
  size = "sm",
}: ChatViewerDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [participantFilter, setParticipantFilter] = useState<string>("all");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    data: messages,
    loading,
    error,
    refetch,
  } = useChatMessages(chat.id.replace("chats:", ""));

  // Get unique participants
  const participants = useMemo(() => {
    if (!messages) return [];
    const unique = new Map();
    messages.forEach((msg) => {
      if (msg.sender) {
        const key = msg.sender.id;
        if (!unique.has(key)) {
          unique.set(key, {
            id: msg.sender.id,
            name: `${msg.sender.name} ${msg.sender.surname}`,
            role: msg.sender.role,
            phone: msg.sender.phone,
          });
        }
      }
    });
    return Array.from(unique.values());
  }, [messages]);

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    if (!messages) return [];

    let filtered = messages.filter((message) => {
      // Participant filter
      console.log(message);
      if (
        participantFilter !== "all" &&
        message.sender?.id !== participantFilter
      ) {
        return false;
      }
      return true;
    });

    // Search filter with highlighting
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered
        .map((message) => {
          const text = message.text.toLowerCase();
          if (text.includes(query)) {
            // Highlight matching text
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(`(${escapedQuery})`, "gi");
            const highlightedText = message.text.replace(
              regex,
              '<mark class="bg-yellow-300 dark:bg-yellow-700/80 text-yellow-900 dark:text-yellow-100 px-1 py-0.5 rounded font-medium shadow-sm">$1</mark>',
            );
            return {
              ...message,
              isHighlighted: true,
              highlightedText,
            } as FilteredMessage;
          }
          return null;
        })
        .filter(Boolean) as FilteredMessage[];
    }

    return filtered as FilteredMessage[];
  }, [messages, searchQuery, participantFilter]);

  // Search navigation
  const searchMatches = useMemo(() => {
    return filteredMessages.filter((msg) => msg.isHighlighted);
  }, [filteredMessages]);

  const handleSearchNavigation = (direction: "next" | "prev") => {
    if (searchMatches.length === 0) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentSearchIndex + 1) % searchMatches.length;
    } else {
      newIndex =
        currentSearchIndex === 0
          ? searchMatches.length - 1
          : currentSearchIndex - 1;
    }

    setCurrentSearchIndex(newIndex);

    // Scroll to the message
    const targetMessage = searchMatches[newIndex];
    if (targetMessage && messageRefs.current[targetMessage.id]) {
      messageRefs.current[targetMessage.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Reset search index when query changes and scroll to first result
  useEffect(() => {
    setCurrentSearchIndex(0);
    if (searchMatches.length > 0) {
      setTimeout(() => {
        const firstMessage = searchMatches[0];
        if (firstMessage && messageRefs.current[firstMessage.id]) {
          messageRefs.current[firstMessage.id]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [searchQuery, searchMatches]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (
      messages &&
      messages.length > 0 &&
      !searchQuery &&
      scrollAreaRef.current
    ) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, searchQuery, scrollToBottom]);

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );

    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && scrollHeight > clientHeight);
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [messages]);

  // Keyboard shortcuts for search navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!searchInputFocused && searchMatches.length > 0) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          if (searchMatches.length === 0) return;
          const newIndex = (currentSearchIndex + 1) % searchMatches.length;
          setCurrentSearchIndex(newIndex);
          const targetMessage = searchMatches[newIndex];
          if (targetMessage && messageRefs.current[targetMessage.id]) {
            messageRefs.current[targetMessage.id]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (searchMatches.length === 0) return;
          const newIndex =
            currentSearchIndex === 0
              ? searchMatches.length - 1
              : currentSearchIndex - 1;
          setCurrentSearchIndex(newIndex);
          const targetMessage = searchMatches[newIndex];
          if (targetMessage && messageRefs.current[targetMessage.id]) {
            messageRefs.current[targetMessage.id]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      }
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
      }
    },
    [searchInputFocused, searchMatches, searchQuery, currentSearchIndex],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const handleCopyChat = () => {
    if (!messages) return;

    const chatText = messages
      .map((msg) => {
        const senderName = msg.sender
          ? `${msg.sender.name} ${msg.sender.surname}`
          : "Неизвестный";
        const timestamp = formatDateTime(msg.date_sent);
        return `[${timestamp}] ${senderName}: ${msg.text}`;
      })
      .join("\n");

    navigator.clipboard.writeText(chatText);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "cadet":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "instructor":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "cadet":
        return "Курсант";
      case "instructor":
        return "Инструктор";
      default:
        return "Пользователь";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={variant as any} size={size}>
            <Eye className="h-3 w-3 mr-1" />
            Просмотр
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Чат: {chat.cadetName} ⟷ {chat.instructorName}
          </DialogTitle>
        </DialogHeader>

        {/* Chat Info Bar */}
        <div className="flex-shrink-0 bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span>
                <span className="font-medium">Курсант:</span> {chat.cadetName}
              </span>
              <span>
                <span className="font-medium">Инструктор:</span>{" "}
                {chat.instructorName}
              </span>
              <span>
                <span className="font-medium">Сообщений:</span>{" "}
                {chat.messageCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyChat}>
                <Copy className="h-3 w-3 mr-1" />
                Копировать
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex-shrink-0 space-y-3">
          <div className="flex gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по тексту сообщений... (Enter - следующий, ↑↓ - навигация, Esc - очистить)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchInputFocused(true)}
                onBlur={() => setSearchInputFocused(false)}
                className="pl-10 pr-20"
              />
              {searchQuery && searchMatches.length > 0 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-md px-2 py-1 border shadow-sm">
                  <span className="text-xs text-muted-foreground font-medium">
                    {currentSearchIndex + 1} из {searchMatches.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => handleSearchNavigation("prev")}
                    disabled={searchMatches.length <= 1}
                    title="Предыдущий результат (↑)"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => handleSearchNavigation("next")}
                    disabled={searchMatches.length <= 1}
                    title="Следующий результат (↓ или Enter)"
                  >
                    ↓
                  </Button>
                </div>
              )}
            </div>

            {/* Participant Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={participantFilter}
                onValueChange={setParticipantFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все участники</SelectItem>
                  {participants.map((participant) => (
                    <SelectItem
                      key={`participant-${participant.id}`}
                      value={participant.id}
                    >
                      {participant.name} ({getRoleName(participant.role)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {searchQuery && (
              <Badge
                variant="secondary"
                className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
              >
                <Search className="h-3 w-3" />
                &quot;{searchQuery}&quot; ({searchMatches.length}{" "}
                {searchMatches.length === 1
                  ? "совпадение"
                  : searchMatches.length < 5
                    ? "совпадения"
                    : "совпадений"}
                )
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-yellow-200 dark:hover:bg-yellow-800"
                  onClick={() => setSearchQuery("")}
                  title="Очистить поиск (Esc)"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {participantFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" />
                {participants.find((p) => p.id === participantFilter)?.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setParticipantFilter("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <span>
              Показано {filteredMessages.length} из {messages?.length || 0}{" "}
              сообщений
              {searchQuery && searchMatches.length > 0 && (
                <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                  • {searchMatches.length} с совпадениями
                </span>
              )}
            </span>
          </div>
        </div>

        <Separator />

        {/* Messages List */}
        <div className="flex-1 overflow-hidden relative">
          <DataState
            data={messages}
            loading={loading}
            error={error}
            onRetry={refetch}
            emptyState={{
              icon: (
                <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50" />
              ),
              title: "Нет сообщений",
              description: "В этом чате пока нет сообщений",
            }}
          >
            {(messagesData) => (
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="space-y-1 p-2">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        {searchQuery || participantFilter !== "all"
                          ? "Сообщения не найдены"
                          : "Нет сообщений"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {searchQuery || participantFilter !== "all"
                          ? "Попробуйте изменить параметры поиска или фильтра"
                          : "В этом чате пока нет сообщений"}
                      </p>
                      {(searchQuery || participantFilter !== "all") && (
                        <div className="flex justify-center gap-2">
                          {searchQuery && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSearchQuery("")}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Очистить поиск
                            </Button>
                          )}
                          {participantFilter !== "all" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setParticipantFilter("all")}
                            >
                              <Filter className="h-3 w-3 mr-1" />
                              Сбросить фильтр
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredMessages.map((message, index) => {
                      const isCurrentSearch =
                        message.isHighlighted &&
                        searchMatches.indexOf(message) === currentSearchIndex;
                      const messageNumber = index + 1;

                      return (
                        <div
                          key={`message-${message.id}-${index}`}
                          ref={(el) => {
                            messageRefs.current[message.id] = el;
                          }}
                          className={cn(
                            "px-2 py-1.5 rounded-md transition-all duration-200 border border-transparent",
                            isCurrentSearch &&
                              "ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200",
                            message.isHighlighted &&
                              !isCurrentSearch &&
                              "bg-yellow-25 dark:bg-yellow-900/10",
                            !message.isHighlighted && "hover:bg-muted/50",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {/* Compact Avatar and Number */}
                            <div className="flex-shrink-0 flex items-center gap-1.5">
                              <div className="text-xs text-muted-foreground font-mono w-6 text-right">
                                #{messageNumber}
                              </div>
                              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-2.5 w-2.5" />
                              </div>
                            </div>

                            {/* Compact Message Content */}
                            <div className="flex-1 min-w-0">
                              {/* Compact Sender Info - Single Line */}
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-medium text-xs truncate">
                                  {message.sender
                                    ? `${message.sender.name} ${message.sender.surname}`
                                    : "Неизвестный пользователь"}
                                </span>
                                {message.sender && (
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-xs px-1 py-0 h-4 leading-none",
                                      getRoleColor(message.sender.role),
                                    )}
                                  >
                                    {message.sender.role === "cadet"
                                      ? "К"
                                      : "И"}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-0.5 text-xs text-muted-foreground ml-auto">
                                  <span
                                    title={formatDateTime(message.date_sent)}
                                    className="whitespace-nowrap"
                                  >
                                    {formatRelativeTime(message.date_sent)}
                                  </span>
                                </div>
                              </div>

                              {/* Compact Message Text */}
                              <div className="text-sm leading-snug break-words">
                                {message.highlightedText ? (
                                  <div
                                    className="whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{
                                      __html: message.highlightedText,
                                    }}
                                  />
                                ) : (
                                  <span className="whitespace-pre-wrap">
                                    {message.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            )}
          </DataState>

          {/* Scroll to Bottom Button */}
          {showScrollButton && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 right-4 rounded-full h-10 w-10 p-0 shadow-lg z-10"
              onClick={scrollToBottom}
              title="Перейти к концу"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
