import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      edificios: Array<{ id: string; nombre: string }>;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    rol: string;
    edificios: Array<{ id: string; nombre: string }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    rol: string;
    edificios: Array<{ id: string; nombre: string }>;
  }
}
