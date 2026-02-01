"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  AlertCircle,
  Calendar,
  Wrench,
  Users,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { ROL_LABELS, type Rol } from "@/types";

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: Rol[]; // Roles que pueden ver este menú
};

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO", "CONSERJE", "RESIDENTE"],
  },
  {
    name: "Edificios",
    href: "/edificios",
    icon: Building2,
    roles: ["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO", "CONSERJE"],
  },
  {
    name: "Incidencias",
    href: "/incidencias",
    icon: AlertCircle,
    roles: ["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO", "CONSERJE", "RESIDENTE"],
  },
  {
    name: "Calendario",
    href: "/calendario",
    icon: Calendar,
    roles: ["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO", "CONSERJE"],
  },
  {
    name: "Empresas",
    href: "/empresas",
    icon: Wrench,
    roles: ["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"],
  },
  {
    name: "Usuarios",
    href: "/usuarios",
    icon: Users,
    roles: ["ADMIN_PLATAFORMA"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = (session?.user?.rol as Rol) || "RESIDENTE";

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Filtrar navegación según el rol del usuario
  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="flex flex-col w-64 bg-white border-r min-h-screen">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Incidencias</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de edificios</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || "Usuario"}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {ROL_LABELS[userRole]}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
