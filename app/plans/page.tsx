"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  CreditCard,
  Edit,
  Trash2,
  Clock,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataState } from "@/components/ui/api-states";
import { Plan } from "@/lib/api/client";
import { PlanDialog } from "@/components/plans/plan-dialog";
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
} from "@/lib/api/hooks";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function PlansPage() {
  const { data: plans, loading, error, refetch } = usePlans();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const filteredPlans = plans
    ? plans.filter((plan) =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleAddPlan = () => {
    setEditingPlan(null);
    setIsPlanDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setIsPlanDialogOpen(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    const result = await deletePlan.execute(planToDelete.id);

    if (result.success) {
      refetch();
      setPlanToDelete(null);
      setIsDeleteDialogOpen(false);
    } else {
      // Show error message if needed
      console.error(`Ошибка при удалении плана: ${result.error}`);
    }
  };

  const handlePlanSubmit = async (planData: Omit<Plan, "id">) => {
    if (editingPlan) {
      // Update existing plan
      const result = await updatePlan.execute(editingPlan.id, planData);
      if (result.success) {
        refetch();
      }
    } else {
      // Create new plan
      const result = await createPlan.execute(planData);
      if (result.success) {
        refetch();
      }
    }
  };

  return (
    <AuthGuard>
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Планы оплаты</h1>
            <Button onClick={handleAddPlan} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Добавить план
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Plans List */}
          <DataState
            data={plans}
            loading={loading}
            error={error}
            onRetry={refetch}
            emptyState={{
              icon: (
                <CreditCard className="h-12 w-12 text-muted-foreground opacity-50" />
              ),
              title: "Планы оплаты не найдены",
              description: searchQuery
                ? "Попробуйте изменить параметры поиска"
                : "Добавьте первый план оплаты для курсантов",
              action: {
                label: "Добавить план",
                onClick: handleAddPlan,
              },
            }}
          >
            {(plansData) => (
              <>
                {filteredPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Планы не найдены
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Попробуйте изменить параметры поиска
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={cn(
                          "shadow-md hover:shadow-lg transition-all relative overflow-hidden",
                          "border-l-4 border-l-primary/40",
                        )}
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 -translate-x-5 -translate-y-10 bg-primary/5 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 translate-x-4 translate-y-6 bg-primary/5 rounded-full"></div>

                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between">
                            <span>{plan.name}</span>
                            <span className="text-xl font-bold text-primary">
                              {new Intl.NumberFormat("ru-RU", {
                                style: "currency",
                                currency: "RUB",
                                maximumFractionDigits: 0,
                              }).format(plan.price)}
                            </span>
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="pt-2">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Практика:{" "}
                                  <span className="font-medium">
                                    {plan.practice_hours} часов
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Теория:{" "}
                                  <span className="font-medium">
                                    {plan.theory_hours} часов
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Стоимость часа:{" "}
                                  <span className="font-medium">
                                    {new Intl.NumberFormat("ru-RU", {
                                      style: "currency",
                                      currency: "RUB",
                                      maximumFractionDigits: 0,
                                    }).format(plan.price / plan.practice_hours)}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPlan(plan)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Изменить
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeletePlan(plan)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Удалить
                              </Button>
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

      {/* Plan Dialog for Add/Edit */}
      <PlanDialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        onSubmit={handlePlanSubmit}
        initialData={editingPlan}
        title={editingPlan ? "Редактирование плана" : "Добавление нового плана"}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeletePlan}
        title="Удаление плана оплаты"
        description={
          planToDelete
            ? `Вы действительно хотите удалить план "${planToDelete.name}"? Это действие нельзя отменить. Удаление плана может повлиять на курсантов, которые уже используют его.`
            : ""
        }
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
        loading={deletePlan.loading}
      />
    </AuthGuard>
  );
}
