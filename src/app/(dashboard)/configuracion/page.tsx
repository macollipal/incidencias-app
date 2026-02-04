"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Palette,
    Mail,
    Database,
    Save,
    Eye,
    EyeOff,
    Globe,
    Settings as SettingsIcon
} from "lucide-react";
import { useAdminConfig, useUpdateConfig } from "@/hooks/use-config";

export default function ConfiguracionPage() {
    const { data: configData, isLoading } = useAdminConfig();
    const updateMutation = useUpdateConfig();
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        if (configData?.configs) {
            setFormData(configData.configs);
        }
    }, [configData]);

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        await updateMutation.mutateAsync(formData);
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
                <p className="text-gray-500">Gestiona los parámetros globales de la aplicación</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <Palette className="w-4 h-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="sistema" className="flex items-center gap-2">
                        <Database className="w-4 h-4" /> Sistema
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Apariencia y Branding</CardTitle>
                            <CardDescription>
                                Personaliza cómo se ve tu aplicación para los usuarios.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="APP_NAME">Nombre de la Aplicación</Label>
                                <Input
                                    id="APP_NAME"
                                    value={formData.APP_NAME || ""}
                                    onChange={(e) => handleChange("APP_NAME", e.target.value)}
                                    placeholder="Ej: Incidencias Edificio X"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="PRIMARY_COLOR">Color Primario (Hex)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="PRIMARY_COLOR"
                                        value={formData.PRIMARY_COLOR || "#2563eb"}
                                        onChange={(e) => handleChange("PRIMARY_COLOR", e.target.value)}
                                        className="flex-1"
                                    />
                                    <div
                                        className="w-10 h-10 rounded border"
                                        style={{ backgroundColor: formData.PRIMARY_COLOR || "#2563eb" }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Este color se aplicará a botones, enlaces y acentos visuales.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de Notificaciones</CardTitle>
                            <CardDescription>
                                Ajusta los parámetros para el envío de correos electrónicos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="RESEND_API_KEY">Resend API Key</Label>
                                <div className="relative">
                                    <Input
                                        id="RESEND_API_KEY"
                                        type={showApiKey ? "text" : "password"}
                                        value={formData.RESEND_API_KEY || ""}
                                        onChange={(e) => handleChange("RESEND_API_KEY", e.target.value)}
                                        placeholder="re_..."
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="FROM_EMAIL">Correo Remitente</Label>
                                <Input
                                    id="FROM_EMAIL"
                                    value={formData.FROM_EMAIL || "notificaciones@tu-edificio.com"}
                                    onChange={(e) => handleChange("FROM_EMAIL", e.target.value)}
                                    placeholder="ej: avisos@edificio.com"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sistema" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado del Sistema</CardTitle>
                            <CardDescription>
                                Información técnica sobre el entorno de ejecución.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="font-medium">Entorno de Ejecución</p>
                                        <p className="text-sm text-gray-500">
                                            {configData?.env.isProd ? "Producción" : "Desarrollo / Local"}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={configData?.env.isProd ? "default" : "secondary"}>
                                    {configData?.env.isProd ? "PROD" : "DEV"}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <Database className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="font-medium">Base de Datos</p>
                                        <p className="text-sm text-gray-500">
                                            Proveedor: {configData?.env.dbSource}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Conexión a DB (Enmascarada)</Label>
                                <Input
                                    value={configData?.masked.DATABASE_URL || ""}
                                    readOnly
                                    className="bg-gray-100 font-mono text-xs"
                                />
                                <p className="text-xs text-red-500">
                                    * La cadena de conexión solo puede cambiarse vía variables de entorno por seguridad.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="w-full lg:w-auto"
                >
                    {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar Cambios
                </Button>
            </div>
        </div>
    );
}
