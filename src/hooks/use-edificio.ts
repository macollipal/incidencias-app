"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";

interface EdificioState {
  selectedEdificioId: string | null;
  setSelectedEdificioId: (id: string | null) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useEdificioStore = create<EdificioState>()(
  persist(
    (set) => ({
      selectedEdificioId: null,
      setSelectedEdificioId: (id) => set({ selectedEdificioId: id }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "edificio-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hook to safely use the store after hydration
export function useEdificioStoreHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);
  const store = useEdificioStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    ...store,
    selectedEdificioId: isHydrated ? store.selectedEdificioId : null,
    isHydrated,
  };
}
