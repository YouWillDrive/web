"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Search,
  User,
  Phone,
  X,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { useInstructorCadets } from "@/lib/api/hooks";
import { DataState } from "@/components/ui/api-states";
import { cn } from "@/lib/utils";

interface InstructorCadetsDialogProps {
  instructorId: string;
  instructorName: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function InstructorCadetsDialog({
  instructorId,
  instructorName,
  trigger,
  className,
}: InstructorCadetsDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: cadets,
    loading,
    error,
    refetch,
  } = useInstructorCadets(instructorId);

  // Refetch data when dialog opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // Filter cadets based on search query
  const filteredCadets = useMemo(() => {
    if (!cadets) return [];

    if (!searchQuery.trim()) return cadets;

    const query = searchQuery.toLowerCase();
    return cadets.filter((cadet) => {
      const fullName =
        `${cadet.name} ${cadet.surname} ${cadet.patronymic || ""}`.toLowerCase();
      const phone = cadet.phone.toLowerCase();
      return fullName.includes(query) || phone.includes(query);
    });
  }, [cadets, searchQuery]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
    }
  };

  const handleTriggerClick = () => {
    setOpen(true);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs font-medium gap-1 hover:bg-primary/10 hover:text-primary border border-primary/20",
                    className,
                  )}
                  disabled={loading}
                  onClick={handleTriggerClick}
                >
                  {loading ? (
                    <Spinner size="sm" className="h-3 w-3" />
                  ) : (
                    <Users className="h-3 w-3" />
                  )}
                  Курсанты
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Посмотреть курсантов этого инструктора</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Курсанты инструктора: {instructorName}
            </DialogTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refetch}
                    disabled={loading}
                    className="h-8 w-8 p-0"
                  >
                    {loading ? (
                      <Spinner size="sm" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Обновить список курсантов</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex-shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или номеру телефона..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Загрузка курсантов...
                </span>
              ) : cadets ? (
                <>
                  Показано {filteredCadets.length} из {cadets.length} курсантов
                  {searchQuery && ` по запросу "${searchQuery}"`}
                </>
              ) : null}
            </span>
            {cadets && cadets.length > 0 && !loading && (
              <Badge variant="secondary" className="text-xs">
                Всего: {cadets.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Cadets List */}
        <div className="flex-1 overflow-hidden">
          <DataState
            data={cadets}
            loading={loading}
            error={error}
            onRetry={refetch}
            emptyState={{
              icon: (
                <Users className="h-12 w-12 text-muted-foreground opacity-50" />
              ),
              title: "Нет курсантов",
              description: "У этого инструктора пока нет назначенных курсантов",
            }}
          >
            {(cadetsData) => (
              <ScrollArea className="h-full">
                {filteredCadets.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Курсанты не найдены
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Попробуйте изменить поисковый запрос
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Очистить поиск
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 p-1">
                    {filteredCadets.map((cadet) => (
                      <Card
                        key={cadet.id}
                        className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-200 hover:border-l-blue-400"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {getInitials(cadet.name, cadet.surname)}
                              </span>
                            </div>

                            {/* Cadet Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-base truncate">
                                  {cadet.surname} {cadet.name}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  Курсант
                                </Badge>
                              </div>

                              {cadet.patronymic && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {cadet.patronymic}
                                </p>
                              )}

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{cadet.phone}</span>
                              </div>
                            </div>

                            {/* ID Badge */}
                            <div className="flex-shrink-0">
                              <Badge variant="outline" className="text-xs">
                                ID: {cadet.id.split(":")[1] || cadet.id}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </DataState>
        </div>
      </DialogContent>
    </Dialog>
  );
}
