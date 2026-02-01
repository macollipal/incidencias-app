import { NextResponse } from "next/server";
import { auth } from "./auth";
import { ZodError } from "zod";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  error: string,
  status = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error, errors }, { status });
}

export function handleZodError(error: ZodError): NextResponse<ApiResponse> {
  const errors: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  });
  return errorResponse("Datos inválidos", 400, errors);
}

export async function getAuthSession() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.rol)) {
    throw new Error("No tiene permisos para esta acción");
  }
  return session;
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error instanceof Error) {
    if (error.message === "No autorizado") {
      return errorResponse("No autorizado", 401);
    }
    if (error.message === "No tiene permisos para esta acción") {
      return errorResponse("No tiene permisos para esta acción", 403);
    }
    return errorResponse(error.message, 500);
  }

  return errorResponse("Error interno del servidor", 500);
}
