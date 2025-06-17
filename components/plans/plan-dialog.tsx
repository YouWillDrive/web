"use client";

import { useState, useEffect } from "react";
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
import { Plan } from "@/lib/api/client";

export interface PlanFormData {
  name: string;
  practice_hours: number;
  theory_hours: number;
  price: number;
}

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanFormData) => void;
  initialData?: Plan | null;
  title: string;
}

export function PlanDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
}: PlanDialogProps) {
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    practice_hours: 0,
    theory_hours: 0,
    price: 0,
  });

  const [errors, setErrors] = useState<Partial<PlanFormData>>({});
  const [hourPrice, setHourPrice] = useState<number>(0);

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          practice_hours: initialData.practice_hours || 0,
          theory_hours: initialData.theory_hours || 0,
          price: initialData.price || 0,
        });
      } else {
        setFormData({
          name: "",
          practice_hours: 0,
          theory_hours: 0,
          price: 0,
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

  // Calculate hour price when relevant form fields change
  useEffect(() => {
    if (formData.practice_hours > 0) {
      setHourPrice(formData.price / formData.practice_hours);
    } else {
      setHourPrice(0);
    }
  }, [formData.price, formData.practice_hours]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PlanFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Название плана обязательно";
    }

    if (formData.practice_hours <= 0) {
      newErrors.practice_hours = "Количество часов практики должно быть больше 0";
    }

    if (formData.theory_hours < 0) {
      newErrors.theory_hours = "Количество часов теории не может быть отрицательным";
    }

    if (formData.price <= 0) {
      newErrors.price = "Стоимость должна быть больше 0";
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

  const handleInputChange = (
    field: keyof PlanFormData,
    value: string | number
  ) => {
    // Convert string values to number for numeric fields
    if (["practice_hours", "theory_hours", "price"].includes(field)) {
      value = Number(value) || 0;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof PlanFormData]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название *
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                  placeholder="Например: Базовый, Стандартный, Премиум"
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="practice_hours" className="text-right">
                Часы практики *
              </Label>
              <div className="col-span-3">
                <Input
                  id="practice_hours"
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.practice_hours}
                  onChange={(e) =>
                    handleInputChange("practice_hours", e.target.value)
                  }
                  className={errors.practice_hours ? "border-destructive" : ""}
                />
                {errors.practice_hours && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.practice_hours}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Количество часов практического вождения
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="theory_hours" className="text-right">
                Часы теории
              </Label>
              <div className="col-span-3">
                <Input
                  id="theory_hours"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.theory_hours}
                  onChange={(e) =>
                    handleInputChange("theory_hours", e.target.value)
                  }
                  className={errors.theory_hours ? "border-destructive" : ""}
                />
                {errors.theory_hours && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.theory_hours}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Количество часов теоретических занятий
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Стоимость *
              </Label>
              <div className="col-span-3">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && (
                  <p className="text-xs text-destructive mt-1">{errors.price}</p>
                )}
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Полная стоимость курса</span>
                  {formData.practice_hours > 0 && (
                    <span>
                      ≈{" "}
                      {new Intl.NumberFormat("ru-RU", {
                        style: "currency",
                        currency: "RUB",
                        maximumFractionDigits: 0,
                      }).format(hourPrice)}{" "}
                      / час
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
