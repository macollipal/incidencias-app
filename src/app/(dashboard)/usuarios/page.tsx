"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Search, Loader2, Pencil, Trash2 } from "lucide-react";
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from "@/hooks/use-usuarios";
import { useEdificios } from "@/hooks/use-edificios";
import { toast } from "sonner";
import { ROL_LABELS, type Rol } from "@/types";

type FormMode = "create" | "edit";

interface FormData {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
  edificioIds: string[];
}

const initialFormData: FormData = {
  email: "",
  password: "",
  nombre: "",
  rol: "RESIDENTE",
  edificioIds: [],
};

export default function UsuariosPage() {
  const { data: session } = useSession();
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: edificios } = useEdificios();
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const deleteMutation = useDeleteUsuario();

  const isAdmin = session?.user?.rol === "ADMIN_PLATAFORMA";

  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const usuariosFiltrados = (usuarios || []).filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getRolBadgeVariant = (rol: string) => {
    switch (rol) {
      case "ADMIN_PLATAFORMA":
        return "default";
      case "ADMIN_EDIFICIO":
        return "secondary";
      case "RESIDENTE":
        return "outline";
      default:
        return "outline";
    }
  };

  const getInitials = (nombre: string) =>
    nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleEdificioToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      edificioIds: prev.edificioIds.includes(id)
        ? prev.edificioIds.filter((e) => e !== id)
        : [...prev.edificioIds, id],
    }));
  };

  const openCreateDialog = () => {
    setFormMode("create");
    setEditingId(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (usuario: typeof usuarios[0]) => {
    setFormMode("edit");
    setEditingId(usuario.id);
    setFormData({
      email: usuario.email,
      password: "",
      nombre: usuario.nombre,
      rol: usuario.rol as Rol,
      edificioIds: usuario.edificios.map((e) => e.id),
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.email || formData.edificioIds.length === 0) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    if (formMode === "create" && !formData.password) {
      toast.error("La contraseña es requerida");
      return;
    }

    try {
      if (formMode === "create") {
        await createMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          rol: formData.rol,
          edificioIds: formData.edificioIds,
        });
        toast.success("Usuario creado correctamente");
      } else if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            nombre: formData.nombre,
            rol: formData.rol,
            edificioIds: formData.edificioIds,
          },
        });
        toast.success("Usuario actualizado correctamente");
      }
      setDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success("Usuario eliminado");
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500">
            Gestiona los usuarios de la plataforma
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {formMode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
                </DialogTitle>
                <DialogDescription>
                  {formMode === "create"
                    ? "Crea un nuevo usuario en la plataforma"
                    : "Modifica los datos del usuario"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <Input
                      id="nombre"
                      placeholder="Juan Pérez"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rol">Rol *</Label>
                    <Select
                      value={formData.rol}
                      onValueChange={(v) => setFormData({ ...formData, rol: v as Rol })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROL_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={formMode === "edit"}
                  />
                  {formMode === "edit" && (
                    <p className="text-xs text-gray-500">El email no se puede modificar</p>
                  )}
                </div>

                {formMode === "create" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Edificios asignados * ({formData.edificioIds.length} seleccionados)</Label>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {edificios && edificios.length > 0 ? (
                      <div className="divide-y">
                        {edificios.map((edificio) => (
                          <div
                            key={edificio.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50"
                          >
                            <Checkbox
                              id={`edificio-${edificio.id}`}
                              checked={formData.edificioIds.includes(edificio.id)}
                              onCheckedChange={() => handleEdificioToggle(edificio.id)}
                            />
                            <label
                              htmlFor={`edificio-${edificio.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <p className="text-sm font-medium">{edificio.nombre}</p>
                              <p className="text-xs text-gray-500">{edificio.direccion}</p>
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 p-4 text-center">
                        No hay edificios disponibles
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {formMode === "create" ? "Crear Usuario" : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(usuarios || []).filter((u) => u.rol === "ADMIN_PLATAFORMA").length}
            </div>
            <p className="text-sm text-gray-500">Admins de Plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(usuarios || []).filter((u) => u.rol === "ADMIN_EDIFICIO").length}
            </div>
            <p className="text-sm text-gray-500">Admins de Edificio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(usuarios || []).filter((u) => u.rol === "RESIDENTE").length}
            </div>
            <p className="text-sm text-gray-500">Residentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Edificios</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosFiltrados.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {getInitials(usuario.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{usuario.nombre}</p>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRolBadgeVariant(usuario.rol)}>
                      {ROL_LABELS[usuario.rol as Rol]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {usuario.edificios.map((edificio) => (
                        <Badge
                          key={edificio.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {edificio.nombre}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(usuario)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(usuario.id)}
                          disabled={usuario.id === session?.user?.id}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {usuariosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 4 : 3}
                    className="text-center py-8 text-gray-500"
                  >
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el usuario y todas
              sus incidencias asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
