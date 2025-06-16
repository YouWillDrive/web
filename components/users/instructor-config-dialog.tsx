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
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Plus, Trash2, Car } from "lucide-react";
import { Car as ApiCar } from "@/lib/api/client";

export interface CarData extends ApiCar {
  id: string;
}

export interface InstructorConfigData {
  cars: CarData[];
}

interface InstructorConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InstructorConfigData) => void;
  instructorName: string;
  initialData?: Partial<InstructorConfigData>;
}

export function InstructorConfigDialog({
  open,
  onOpenChange,
  onSubmit,
  instructorName,
  initialData,
}: InstructorConfigDialogProps) {
  const [cars, setCars] = useState<CarData[]>([]);
  const [newCar, setNewCar] = useState<ApiCar>({
    model: "",
    plateNumber: "",
    color: "",
  });
  const [errors, setErrors] = useState<{
    newCar?: { model?: string; plateNumber?: string; color?: string };
    general?: string;
  }>({});

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      setCars(initialData?.cars || []);
      setNewCar({ model: "", plateNumber: "", color: "" });
      setErrors({});
    }
  }, [open, initialData]);

  const validateNewCar = (): boolean => {
    const newErrors: { model?: string; plateNumber?: string; color?: string } =
      {};

    if (!newCar.model.trim()) {
      newErrors.model = "Модель обязательна";
    }

    if (!newCar.plateNumber.trim()) {
      newErrors.plateNumber = "Номер обязателен";
    } else if (
      !/^[А-Я]{1}\d{3}[А-Я]{2}\d{2,3}$/.test(
        newCar.plateNumber.toUpperCase().replace(/\s/g, ""),
      )
    ) {
      // Basic Russian license plate validation (simplified)
      newErrors.plateNumber = "Некорректный формат номера";
    }

    if (!newCar.color.trim()) {
      newErrors.color = "Цвет обязателен";
    }

    // Check for duplicate plate numbers
    const duplicatePlate = cars.some(
      (car) =>
        car.plateNumber.toLowerCase() === newCar.plateNumber.toLowerCase(),
    );
    if (duplicatePlate) {
      newErrors.plateNumber = "Автомобиль с таким номером уже добавлен";
    }

    setErrors({ newCar: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCar = () => {
    if (!validateNewCar()) {
      return;
    }

    const carToAdd: CarData = {
      id: Date.now().toString(),
      model: newCar.model.trim(),
      plateNumber: newCar.plateNumber.trim().toUpperCase(),
      color: newCar.color.trim(),
    };

    setCars((prev) => [...prev, carToAdd]);
    setNewCar({ model: "", plateNumber: "", color: "" });
    setErrors({});
  };

  const handleRemoveCar = (carId: string) => {
    setCars((prev) => prev.filter((car) => car.id !== carId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cars.length === 0) {
      setErrors({ general: "Добавьте хотя бы один автомобиль" });
      return;
    }

    onSubmit({ cars });
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof ApiCar, value: string) => {
    setNewCar((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors.newCar?.[field]) {
      setErrors((prev) => ({
        ...prev,
        newCar: { ...prev.newCar, [field]: undefined },
      }));
    }
    // Clear general error when user makes changes
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Настройка инструктора: {instructorName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* General Error */}
            {errors.general && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {errors.general}
              </div>
            )}

            {/* Add New Car Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Добавить автомобиль</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="model">Модель *</Label>
                  <Input
                    id="model"
                    placeholder="например, Lada Vesta"
                    value={newCar.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    className={errors.newCar?.model ? "border-destructive" : ""}
                  />
                  {errors.newCar?.model && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.newCar.model}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="plateNumber">Номер *</Label>
                  <Input
                    id="plateNumber"
                    placeholder="А123БВ77"
                    value={newCar.plateNumber}
                    onChange={(e) =>
                      handleInputChange("plateNumber", e.target.value)
                    }
                    className={
                      errors.newCar?.plateNumber ? "border-destructive" : ""
                    }
                  />
                  {errors.newCar?.plateNumber && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.newCar.plateNumber}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="color">Цвет *</Label>
                  <Input
                    id="color"
                    placeholder="например, белый"
                    value={newCar.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className={errors.newCar?.color ? "border-destructive" : ""}
                  />
                  {errors.newCar?.color && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.newCar.color}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddCar}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить автомобиль
              </Button>
            </div>

            {/* Cars List Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Автомобили инструктора ({cars.length})
              </h3>

              {cars.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Автомобили не добавлены</p>
                  <p className="text-sm">Добавьте хотя бы один автомобиль</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cars.map((car) => (
                    <Card key={car.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Car className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{car.model}</h4>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>№ {car.plateNumber}</span>
                                <span>Цвет: {car.color}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCar(car.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
            <Button type="submit">Сохранить настройки</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
