"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, MapPin, Loader2, Pencil, Trash2 } from "lucide-react";
import { useEdificioStoreHydrated } from "@/hooks/use-edificio";
import { useEdificios, useCreateEdificio, useUpdateEdificio, useDeleteEdificio } from "@/hooks/use-edificios";
import { toast } from "sonner";

type FormMode = "create" | "edit";

const initialFormData = { nombre: "", direccion: "" };

export default function EdificiosPage() {
  const { data: session } = useSession();
  const { selectedEdificioId, setSelectedEdificioId } = useEdificioStoreHydrated();
  const { data: edificios, isLoading } = useEdificios();
  const createMutation = useCreateEdificio();
  const updateMutation = useUpdateEdificio();
  const deleteMutation = useDeleteEdificio();
  const isAdmin = session?.user?.rol === "ADMIN_PLATAFORMA";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const openCreateDialog = () => {
    setFormMode("create");
    setEditingId(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (edificio: NonNullable<typeof edificios>[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode("edit");
    setEditingId(edificio.id);
    setFormData({
      nombre: edificio.nombre,
      direccion: edificio.direccion,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.direccion) {
      toast.error("Complete todos los campos");
      return;
    }

    try {
      if (formMode === "create") {
        await createMutation.mutateAsync(formData);
        toast.success("Edificio creado correctamente");
      } else if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
        toast.success("Edificio actualizado correctamente");
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
      if (selectedEdificioId === deletingId) {
        setSelectedEdificioId(null);
      }
      toast.success("Edificio eliminado");
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
          <h1 className="text-2xl font-bold text-gray-900">Edificios</h1>
          <p className="text-gray-500">
            Gestiona los edificios de la plataforma
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Edificio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {formMode === "create" ? "Nuevo Edificio" : "Editar Edificio"}
                </DialogTitle>
                <DialogDescription>
                  {formMode === "create"
                    ? "Agrega un nuevo edificio a la plataforma"
                    : "Modifica los datos del edificio"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Torre Norte"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    placeholder="Ej: Av. Principal 123, Santiago"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
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
                  {formMode === "create" ? "Crear Edificio" : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {edificios?.map((edificio) => (
          <Card
            key={edificio.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedEdificioId === edificio.id
                ? "ring-2 ring-blue-500"
                : ""
            }`}
            onClick={() => setSelectedEdificioId(edificio.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{edificio.nombre}</CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedEdificioId === edificio.id && (
                    <Badge variant="secondary">Activo</Badge>
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openEditDialog(edificio, e)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openDeleteDialog(edificio.id, e)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{edificio.direccion}</span>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">
                    {edificio._count.incidencias}
                  </span>
                  <span className="text-gray-500 ml-1">incidencias</span>
                </div>
                {edificio.urgentes > 0 && (
                  <div>
                    <span className="font-semibold text-red-600">
                      {edificio.urgentes}
                    </span>
                    <span className="text-gray-500 ml-1">urgentes</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!edificios || edificios.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mb-4" />
              <CardTitle className="text-lg text-gray-600">
                No hay edificios
              </CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Crea tu primer edificio para comenzar"
                  : "No tienes edificios asignados"}
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar edificio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todas las
              incidencias y visitas asociadas al edificio.
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
