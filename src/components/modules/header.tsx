"use client";

import { useSession } from "next-auth/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface HeaderProps {
  selectedEdificio: string | null;
  onEdificioChange: (edificioId: string) => void;
}

export function Header({ selectedEdificio, onEdificioChange }: HeaderProps) {
  const { data: session } = useSession();
  const edificios = session?.user?.edificios || [];

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Edificio activo:
          </span>
        </div>
        <Select value={selectedEdificio || ""} onValueChange={onEdificioChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleccionar edificio" />
          </SelectTrigger>
          <SelectContent>
            {edificios.map((edificio) => (
              <SelectItem key={edificio.id} value={edificio.id}>
                {edificio.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
