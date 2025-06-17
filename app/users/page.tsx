"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  UserPlus,
  Edit,
  Search,
  Filter,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserDialog, UserFormData } from "@/components/users/user-dialog";
import {
  CadetConfigDialog,
  CadetConfigData,
} from "@/components/users/cadet-config-dialog";
import {
  InstructorConfigDialog,
  InstructorConfigData,
} from "@/components/users/instructor-config-dialog";
import { InstructorCadetsDialog } from "@/components/users/instructor-cadets-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useState, useMemo } from "react";
import { User as ApiUser } from "@/lib/api/client";
import { DataState } from "@/components/ui/api-states";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useConfigureCadet,
  useConfigureInstructor,
  useDeleteUser,
} from "@/lib/api/hooks";

interface UserData {
  id: string;
  name: string;
  surname: string;
  patronymic?: string;
  phone: string;
  role: "admin" | "instructor" | "cadet";
}

export default function UsersPage() {
  const { data: apiUsers, loading, error, refetch } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const configureCadet = useConfigureCadet();
  const configureInstructor = useConfigureInstructor();
  const deleteUser = useDeleteUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [cadetConfigDialogOpen, setCadetConfigDialogOpen] = useState(false);
  const [instructorConfigDialogOpen, setInstructorConfigDialogOpen] =
    useState(false);
  const [configuringUser, setConfiguringUser] = useState<UserData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Transform API users to component format
  const users: UserData[] = useMemo(() => {
    if (!apiUsers) return [];
    return apiUsers.map((user: ApiUser) => ({
      id: user.id,
      name: user.name,
      surname: user.surname,
      patronymic: user.patronymic,
      phone: user.phone,
      role: user.role as "admin" | "instructor" | "cadet",
    }));
  }, [apiUsers]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "instructor":
        return "default";
      case "cadet":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "instructor":
        return "Инструктор";
      case "cadet":
        return "Курсант";
      default:
        return "Курсант";
    }
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName =
          `${user.name} ${user.surname} ${user.patronymic || ""}`.toLowerCase();
        const phone = user.phone.toLowerCase();

        return fullName.includes(query) || phone.includes(query);
      }

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  const handleAddUser = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleSubmit = async (formData: UserFormData) => {
    if (editingUser) {
      // Update existing user
      const result = await updateUser.execute(editingUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        patronymic: formData.patronymic,
        phone: formData.phone,
        password: formData.password,
      });

      if (result.success) {
        refetch(); // Refresh the users list
      }
    } else {
      // Add new user
      const result = await createUser.execute({
        firstName: formData.firstName,
        lastName: formData.lastName,
        patronymic: formData.patronymic,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      if (result.success) {
        refetch(); // Refresh the users list
      }
    }
  };

  const handleConfigure = (user: UserData) => {
    setConfiguringUser(user);
    if (user.role === "cadet") {
      setCadetConfigDialogOpen(true);
    } else if (user.role === "instructor") {
      setInstructorConfigDialogOpen(true);
    }
  };

  const handleCadetConfigSubmit = async (configData: CadetConfigData) => {
    if (!configuringUser) return;

    const [tableName, recordId] = configData.instructorId.split(":");

    const result = await configureCadet.execute(configuringUser.id, {
      paymentPlan: configData.paymentPlan,
      instructorId: configData.instructorId,
      isAutomatic: configData.isAutomatic,
      spentHours: Number(configData.spentHours),
      bonusHours: Number(configData.bonusHours),
    });

    if (result.success) {
      console.log("Cadet configuration saved successfully");
    }
  };

  const handleInstructorConfigSubmit = async (
    configData: InstructorConfigData,
  ) => {
    if (!configuringUser) return;

    const result = await configureInstructor.execute(
      configuringUser.id,
      configData.cars,
    );

    if (result.success) {
      console.log("Instructor configuration saved successfully");
    }
  };

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    const result = await deleteUser.execute(userToDelete.id);

    if (result.success) {
      refetch(); // Refresh the users list
      setUserToDelete(null);
      setDeleteConfirmOpen(false);
    } else {
      console.error(`Ошибка при удалении пользователя: ${result.error}`);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AuthGuard>
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-full">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Пользователи</h1>
            <Button onClick={handleAddUser} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Добавить
            </Button>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Фильтр по роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="instructor">Инструктор</SelectItem>
                  <SelectItem value="cadet">Курсант</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataState
            data={users}
            loading={loading}
            error={error}
            onRetry={refetch}
            emptyState={{
              icon: (
                <User className="h-12 w-12 text-muted-foreground opacity-50" />
              ),
              title: "Пользователи не найдены",
              description:
                searchQuery || roleFilter !== "all"
                  ? "Попробуйте изменить параметры поиска или фильтра"
                  : "Пока нет пользователей в системе",
              action: {
                label: "Добавить пользователя",
                onClick: handleAddUser,
              },
            }}
          >
            {(usersData) => (
              <>
                {/* Results count */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Показано {filteredUsers.length} из {usersData.length}{" "}
                    пользователей
                  </p>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Пользователи не найдены
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Попробуйте изменить параметры поиска или фильтра
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.id}
                        className="shadow-md hover:shadow-lg transition-all"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* User Avatar with Initials */}
                            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-semibold text-primary">
                                {getInitials(user.name, user.surname)}
                              </span>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0 py-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={getRoleBadgeVariant(user.role)}
                                  className="text-xs"
                                >
                                  {getRoleDisplayName(user.role)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  #{user.id.split(":")[1] || user.id}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base leading-tight truncate">
                                  {user.surname} {user.name}
                                </h3>
                                {user.role === "instructor" && (
                                  <InstructorCadetsDialog
                                    instructorId={user.id}
                                    instructorName={`${user.surname} ${user.name}`}
                                  />
                                )}
                              </div>

                              {user.patronymic && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {user.patronymic}
                                </p>
                              )}

                              <p className="text-xs text-muted-foreground mt-1">
                                {user.phone}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex-shrink-0 flex flex-col gap-2 min-w-[120px]">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="h-8 px-3 text-xs w-full"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Редактировать
                              </Button>
                              {(user.role === "cadet" ||
                                user.role === "instructor") && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleConfigure(user)}
                                  className="h-8 px-3 text-xs w-full"
                                >
                                  <Settings className="h-3 w-3 mr-1" />
                                  Настроить
                                </Button>
                              )}
                              {(user.role === "cadet" ||
                                user.role === "instructor") && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  className="h-8 px-3 text-xs w-full"
                                  disabled={deleteUser.loading}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Удалить
                                </Button>
                              )}
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

          {/* User Dialog */}
          <UserDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={handleSubmit}
            initialData={
              editingUser
                ? {
                    firstName: editingUser.name,
                    lastName: editingUser.surname,
                    patronymic: editingUser.patronymic || "",
                    phone: editingUser.phone,
                    password: "",
                    role: editingUser.role,
                  }
                : undefined
            }
            title={
              editingUser
                ? "Редактировать пользователя"
                : "Добавить пользователя"
            }
          />

          {/* Cadet Configuration Dialog */}
          {configuringUser && configuringUser.role === "cadet" && (
            <CadetConfigDialog
              open={cadetConfigDialogOpen}
              onOpenChange={setCadetConfigDialogOpen}
              onSubmit={handleCadetConfigSubmit}
              cadetName={`${configuringUser.name} ${configuringUser.surname}`}
              cadetId={configuringUser.id}
            />
          )}

          {/* Instructor Configuration Dialog */}
          {configuringUser && configuringUser.role === "instructor" && (
            <InstructorConfigDialog
              open={instructorConfigDialogOpen}
              onOpenChange={setInstructorConfigDialogOpen}
              onSubmit={handleInstructorConfigSubmit}
              instructorName={`${configuringUser.name} ${configuringUser.surname}`}
              instructorId={configuringUser.id}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onConfirm={confirmDeleteUser}
            title="Удаление пользователя"
            description={
              userToDelete
                ? `Вы действительно хотите удалить ${getRoleDisplayName(userToDelete.role).toLowerCase()} "${userToDelete.surname} ${userToDelete.name}"? Это действие нельзя отменить. Все связанные данные (конфигурации, история обучения) также будут удалены.`
                : ""
            }
            confirmText="Удалить"
            cancelText="Отмена"
            variant="destructive"
            loading={deleteUser.loading}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
