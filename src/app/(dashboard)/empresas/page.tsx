"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Building, Phone, Mail, Loader2, Pencil, Trash2 } from "lucide-react";
import { useEmpresas, useCreateEmpresa, useUpdateEmpresa, useDeleteEmpresa } from "@/hooks/use-empresas";
import { toast } from "sonner";
import { TIPO_SERVICIO_LABELS, type TipoServicio } from "@/types";

type FormMode = "create" | "edit";

interface FormData {
  nombre: string;
  telefono: string;
  email: string;
  tiposServicio: TipoServicio[];
}

const initialFormData: FormData = {
  nombre: "",
  telefono: "",
  email: "",
  tiposServicio: [],
};

export default function EmpresasPage() {
  const { data: session } = useSession();
  const { data: empresas, isLoading } = useEmpresas();
  const createMutation = useCreateEmpresa();
  const updateMutation = useUpdateEmpresa();
  const deleteMutation = useDeleteEmpresa();
  const isAdmin = session?.user?.rol === "ADMIN_PLATAFORMA";

  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const empresasFiltradas = (empresas || []).filter(
    (empresa) =>
      empresa.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      empresa.tiposServicio.some((t) =>
        TIPO_SERVICIO_LABELS[t as TipoServicio]?.toLowerCase().includes(busqueda.toLowerCase())
      )
  );

  const handleTipoToggle = (tipo: TipoServicio) => {
    setFormData((prev) => ({
      ...prev,
      tiposServicio: prev.tiposServicio.includes(tipo)
        ? prev.tiposServicio.filter((t) => t !== tipo)
        : [...prev.tiposServicio, tipo],
    }));
  };

  const openCreateDialog = () => {
    setFormMode("create");
    setEditingId(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (empresa: NonNullable<typeof empresas>[0]) => {
    setFormMode("edit");
    setEditingId(empresa.id);
    setFormData({
      nombre: empresa.nombre,
      telefono: empresa.telefono || "",
      email: empresa.email || "",
      tiposServicio: empresa.tiposServicio as TipoServicio[],
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre || formData.tiposServicio.length === 0) {
      toast.error("Complete el nombre y seleccione al menos un tipo de servicio");
      return;
    }

    try {
      if (formMode === "create") {
        await createMutation.mutateAsync({
          nombre: formData.nombre,
          telefono: formData.telefono || undefined,
          email: formData.email || undefined,
          tiposServicio: formData.tiposServicio,
        });
        toast.success("Empresa creada correctamente");
      } else if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            nombre: formData.nombre,
            telefono: formData.telefono || undefined,
            email: formData.email || undefined,
            tiposServicio: formData.tiposServicio,
          },
        });
        toast.success("Empresa actualizada correctamente");
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
      toast.success("Empresa eliminada");
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
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-500">
            Catálogo de empresas de servicios externos
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {formMode === "create" ? "Nueva Empresa" : "Editar Empresa"}
                </DialogTitle>
                <DialogDescription>
                  {formMode === "create"
                    ? "Agrega una empresa de servicios al catálogo"
                    : "Modifica los datos de la empresa"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Servicios Eléctricos SpA"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="+56 9 1234 5678"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.cl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipos de Servicio *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TIPO_SERVICIO_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={formData.tiposServicio.includes(key as TipoServicio)}
                          onCheckedChange={() => handleTipoToggle(key as TipoServicio)}
                        />
                        <label htmlFor={key} className="text-sm cursor-pointer">
                          {label}
                        </label>
                      </div>
                    ))}
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
                  {formMode === "create" ? "Crear Empresa" : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar empresas o servicios..."
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
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead className="text-right">Visitas</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresasFiltradas.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Building className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="font-medium">{empresa.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {empresa.telefono && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{empresa.telefono}</span>
                        </div>
                      )}
                      {empresa.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{empresa.email}</span>
                        </div>
                      )}
                      {!empresa.telefono && !empresa.email && (
                        <span className="text-sm text-gray-400">Sin contacto</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {empresa.tiposServicio.map((tipo) => (
                        <Badge key={tipo} variant="outline" className="text-xs">
                          {TIPO_SERVICIO_LABELS[tipo as TipoServicio]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {empresa._count.visitas}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(empresa)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(empresa.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {empresasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-gray-500">
                    No se encontraron empresas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(TIPO_SERVICIO_LABELS).map(([key, label]) => {
          const empresasDelTipo = (empresas || []).filter((e) =>
            e.tiposServicio.includes(key)
          );
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <CardDescription>
                  {empresasDelTipo.length} empresa(s) disponible(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {empresasDelTipo.slice(0, 3).map((empresa) => (
                    <div
                      key={empresa.id}
                      className="text-sm text-gray-600 truncate"
                    >
                      {empresa.nombre}
                    </div>
                  ))}
                  {empresasDelTipo.length === 0 && (
                    <p className="text-sm text-gray-400">
                      Sin empresas registradas
                    </p>
                  )}
                  {empresasDelTipo.length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{empresasDelTipo.length - 3} más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la empresa y
              todas sus visitas asociadas.
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
