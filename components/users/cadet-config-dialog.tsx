"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { api, Instructor, Plan } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export interface CadetConfigData {
  paymentPlan: string;
  instructorId: string;
  isAutomatic: boolean;
  spentHours: string;
  bonusHours: string;
}

interface CadetConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CadetConfigData) => void;
  cadetName: string;
  cadetId: string;
  initialData?: Partial<CadetConfigData>;
}

export function CadetConfigDialog({
  open,
  onOpenChange,
  onSubmit,
  cadetName,
  cadetId,
  initialData,
}: CadetConfigDialogProps) {
  const [formData, setFormData] = useState<CadetConfigData>({
    paymentPlan: "",
    instructorId: "",
    isAutomatic: false,
    spentHours: "0",
    bonusHours: "0",
  });

  const [instructorSearch, setInstructorSearch] = useState("");
  const [errors, setErrors] = useState<Partial<CadetConfigData>>({});
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<Plan[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Filter instructors based on search
  const filteredInstructors = instructors.filter((instructor) =>
    `${instructor.surname} ${instructor.name}`
      .toLowerCase()
      .includes(instructorSearch.toLowerCase()),
  );

  // Load instructors and plans when dialog opens
  useEffect(() => {
    const loadData = async () => {
      if (open && instructors.length === 0) {
        setLoadingData(true);
        try {
          const [instructorsResult, plansResult] = await Promise.all([
            api.instructors.getAll(),
            api.plans.getAll(),
          ]);

          if (instructorsResult.success && instructorsResult.data) {
            setInstructors(instructorsResult.data);
          }

          if (plansResult.success && plansResult.data) {
            setPaymentPlans(plansResult.data);
          }
        } catch (error) {
          console.error("Failed to load dialog data:", error);
        } finally {
          setLoadingData(false);
        }
      }
    };

    loadData();
  }, [open, instructors.length]);

  // Load existing configuration when dialog opens
  useEffect(() => {
    const loadConfig = async () => {
      if (open && cadetId) {
        setLoadingConfig(true);
        try {
          const configResult = await api.cadets.getConfig(cadetId);

          if (configResult.success && configResult.data) {
            setFormData({
              paymentPlan: configResult.data.paymentPlan || "",
              instructorId: configResult.data.instructorId || "",
              isAutomatic: configResult.data.isAutomatic || false,
              spentHours: configResult.data.spentHours?.toString() || "0",
              bonusHours: configResult.data.bonusHours?.toString() || "0",
            });
          }
        } catch (error) {
          console.error("Failed to load cadet config:", error);
        } finally {
          setLoadingConfig(false);
        }
      }
    };

    loadConfig();
  }, [open, cadetId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setInstructorSearch("");
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CadetConfigData> = {};

    if (!formData.paymentPlan) {
      newErrors.paymentPlan = "Выберите план оплаты";
    }

    if (!formData.instructorId) {
      newErrors.instructorId = "Выберите инструктора";
    }

    if (Number.parseInt(formData.spentHours) < 0) {
      newErrors.spentHours = "Количество часов не может быть отрицательным";
    }

    if (Number.parseInt(formData.bonusHours) < 0) {
      newErrors.bonusHours =
        "Количество бонусных часов не может быть отрицательным";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof CadetConfigData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing/selecting
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getSelectedInstructorName = () => {
    const instructor = instructors.find((i) => i.id === formData.instructorId);
    return instructor ? `${instructor.surname} ${instructor.name}` : "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Настройка курсанта: {cadetName}</DialogTitle>
          </DialogHeader>

          {loadingData || loadingConfig ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="md" />
              <span className="ml-2 text-sm text-muted-foreground">
                {loadingData
                  ? "Загрузка данных..."
                  : "Загрузка конфигурации..."}
              </span>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              {/* Payment Plan */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentPlan" className="text-right">
                  План оплаты *
                </Label>
                <div className="col-span-3">
                  <Select
                    value={formData.paymentPlan}
                    onValueChange={(value) =>
                      handleInputChange("paymentPlan", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.paymentPlan ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Выберите план оплаты" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.practice_hours} практ. часов)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.paymentPlan && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.paymentPlan}
                    </p>
                  )}
                </div>
              </div>

              {/* Instructor Selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="instructor" className="text-right">
                  Инструктор *
                </Label>
                <div className="col-span-3">
                  <div className="relative">
                    <Select
                      value={formData.instructorId}
                      onValueChange={(value) =>
                        handleInputChange("instructorId", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.instructorId ? "border-destructive" : ""
                        }
                      >
                        <SelectValue placeholder="Выберите инструктора" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="flex items-center gap-2 px-2 py-1.5 border-b">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Поиск инструктора..."
                            value={instructorSearch}
                            onChange={(e) =>
                              setInstructorSearch(e.target.value)
                            }
                            className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                        {filteredInstructors.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Инструктор не найден
                          </div>
                        ) : (
                          filteredInstructors.map((instructor) => (
                            <SelectItem
                              key={instructor.id}
                              value={instructor.id}
                            >
                              {instructor.surname} {instructor.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.instructorId && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.instructorId}
                    </p>
                  )}
                </div>
              </div>

              {/* Transmission Type */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transmission" className="text-right">
                  Коробка передач
                </Label>
                <div className="col-span-3 flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Механическая
                  </span>
                  <Switch
                    id="transmission"
                    checked={formData.isAutomatic}
                    onCheckedChange={(checked) =>
                      handleInputChange("isAutomatic", checked)
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    Автоматическая
                  </span>
                </div>
              </div>

              {/* Spent Hours */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="spentHours" className="text-right">
                  Проведено часов
                </Label>
                <div className="col-span-3">
                  <Input
                    id="spentHours"
                    type="number"
                    min="0"
                    max="200"
                    step="0.5"
                    placeholder="0"
                    value={formData.spentHours}
                    onChange={(e) =>
                      handleInputChange(
                        "spentHours",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className={errors.spentHours ? "border-destructive" : ""}
                  />
                  {errors.spentHours && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.spentHours}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Количество часов, проведенных до внедрения системы
                  </p>
                </div>
              </div>

              {/* Bonus Hours */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bonusHours" className="text-right">
                  Бонусные часы
                </Label>
                <div className="col-span-3">
                  <Input
                    id="bonusHours"
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    placeholder="0"
                    value={formData.bonusHours}
                    onChange={(e) =>
                      handleInputChange(
                        "bonusHours",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className={errors.bonusHours ? "border-destructive" : ""}
                  />
                  {errors.bonusHours && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.bonusHours}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Дополнительные часы для курсанта
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loadingData || loadingConfig}>
              Сохранить настройки
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
