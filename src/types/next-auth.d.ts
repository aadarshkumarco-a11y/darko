import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    isGuest?: boolean;
    displayName?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isGuest: boolean;
      displayName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    isGuest: boolean;
    displayName: string;
  }
}
