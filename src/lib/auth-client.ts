import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Uses relative /api/auth in the browser by default.
});
