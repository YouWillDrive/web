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
import { Plus, Trash2, Car as CarIcon, Info } from "lucide-react";
import { Car as ApiCar } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";
import { useGetInstructorCars } from "@/lib/api/hooks";
import { ErrorState } from "@/components/ui/api-states";
import { LicensePlate } from "@/components/ui/license-plate";

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
  instructorId: string;
}

export function InstructorConfigDialog({
  open,
  onOpenChange,
  onSubmit,
  instructorName,
  instructorId,
}: InstructorConfigDialogProps) {
  const [cars, setCars] = useState<CarData[]>([]);
  const [newCar, setNewCar] = useState<Omit<ApiCar, "id">>({
    model: "",
    plateNumber: "",
    color: "",
  });
  const [errors, setErrors] = useState<{
    newCar?: { model?: string; plateNumber?: string; color?: string };
    general?: string;
  }>({});

  const {
    data: initialCars,
    loading,
    error: fetchError,
    refetch,
  } = useGetInstructorCars(open ? instructorId : "");

  useEffect(() => {
    if (initialCars) {
      setCars(
        initialCars.map((car) => ({
          ...car,
          id: car.id || `car-${Date.now()}-${Math.random()}`,
        })),
      );
    }
  }, [initialCars]);

  const validateNewCar = (): boolean => {
    const newErrors: { model?: string; plateNumber?: string; color?: string } =
      {};
    if (!newCar.model.trim()) newErrors.model = "Модель обязательна";
    if (!newCar.plateNumber.trim()) newErrors.plateNumber = "Номер обязателен";
    if (!newCar.color.trim()) newErrors.color = "Цвет обязателен";

    // Validate plate number format
    const platePattern = /^[А-ЯA-Z]\d{1,3}[А-ЯA-Z]{2}\d{2,3}(RUS)?$/i;
    if (
      newCar.plateNumber.trim() &&
      !platePattern.test(newCar.plateNumber.trim())
    ) {
      newErrors.plateNumber = "Некорректный формат номера";
    }

    if (
      cars.some(
        (c) => c.plateNumber.toLowerCase() === newCar.plateNumber.toLowerCase(),
      )
    ) {
      newErrors.plateNumber = "Автомобиль с таким номером уже добавлен";
    }

    setErrors({ newCar: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCar = () => {
    if (!validateNewCar()) return;
    setCars((prev) => [...prev, { ...newCar, id: `temp-${Date.now()}` }]);
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

  const handleInputChange = (
    field: keyof Omit<ApiCar, "id">,
    value: string,
  ) => {
    setNewCar((prev) => ({ ...prev, [field]: value }));
    if (errors.newCar?.[field]) {
      setErrors((prev) => ({
        ...prev,
        newCar: { ...prev.newCar, [field]: undefined },
      }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Настройка инструктора: {instructorName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : fetchError ? (
          <div className="flex-1">
            <ErrorState error={fetchError} onRetry={refetch} />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="overflow-y-auto pr-2 space-y-6 py-4">
              {errors.general && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {errors.general}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Добавить автомобиль</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="model">Модель *</Label>
                    <Input
                      id="model"
                      value={newCar.model}
                      onChange={(e) =>
                        handleInputChange("model", e.target.value)
                      }
                      className={
                        errors.newCar?.model ? "border-destructive" : ""
                      }
                    />
                    {errors.newCar?.model && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.newCar.model}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="space-y-1.5">
                      <Label htmlFor="plateNumber">Номер *</Label>
                      <Input
                        id="plateNumber"
                        value={newCar.plateNumber}
                        onChange={(e) =>
                          handleInputChange("plateNumber", e.target.value)
                        }
                        className={
                          errors.newCar?.plateNumber ? "border-destructive" : ""
                        }
                        placeholder="A123BC45RUS"
                      />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" />
                        <span>Формат: A123BC45RUS или A123BC45</span>
                      </div>
                    </div>
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
                      value={newCar.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                      className={
                        errors.newCar?.color ? "border-destructive" : ""
                      }
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
                  <Plus className="h-4 w-4 mr-2" /> Добавить автомобиль
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Автомобили инструктора ({cars.length})
                </h3>
                {cars.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Автомобили не добавлены</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cars.map((car) => (
                      <Card key={car.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <CarIcon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{car.model}</h4>
                                <div className="flex items-center gap-4 text-sm">
                                  <LicensePlate
                                    plateNumber={car.plateNumber}
                                    variant="compact"
                                  />
                                  <span className="text-muted-foreground">
                                    Цвет: {car.color}
                                  </span>
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
            <DialogFooter className="mt-auto pt-4 border-t">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
