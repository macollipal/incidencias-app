"use client";

import { useEffect } from "react";
import { usePublicConfig } from "@/hooks/use-config";

export function ThemeInitializer() {
    const { data: config } = usePublicConfig();

    useEffect(() => {
        if (config?.PRIMARY_COLOR) {
            document.documentElement.style.setProperty(
                "--primary",
                hexToHsl(config.PRIMARY_COLOR)
            );
            // También podemos actualizar el color de los badges o acentos si es necesario
            document.documentElement.style.setProperty(
                "--ring",
                hexToHsl(config.PRIMARY_COLOR)
            );
        }

        if (config?.APP_NAME) {
            document.title = config.APP_NAME;
        }
    }, [config]);

    return null;
}

// Función auxiliar para convertir Hex a HSL format que espera Shadcn
function hexToHsl(hex: string): string {
    // Eliminar el # si existe
    hex = hex.replace(/^#/, "");

    // Convertir a RGB
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
