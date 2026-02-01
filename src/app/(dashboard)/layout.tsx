"use client";

import { Sidebar } from "@/components/modules/sidebar";
import { Header } from "@/components/modules/header";
import { useEdificioStoreHydrated } from "@/hooks/use-edificio";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { selectedEdificioId, setSelectedEdificioId, isHydrated } = useEdificioStoreHydrated();

  // Auto-select first edificio if none selected
  useEffect(() => {
    if (isHydrated && !selectedEdificioId && session?.user?.edificios?.length) {
      setSelectedEdificioId(session.user.edificios[0].id);
    }
  }, [session, selectedEdificioId, setSelectedEdificioId, isHydrated]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          selectedEdificio={selectedEdificioId}
          onEdificioChange={setSelectedEdificioId}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
