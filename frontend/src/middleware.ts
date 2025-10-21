import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware();

export const config = {
  matcher: [
    "/",
    "/home",
    "/build",
    "/profile/new",
    "/calendar",
    "/settings",
    "/support",
    "/api/appointments/:path*",
    "/api/profiles/:path*",
  ],
};
