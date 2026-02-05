import * as auth from "./auth";
import * as items from "./items";

// A concrete schema object for Drizzle adapters that require table access.
export const schema = {
  ...auth,
  ...items,
};
