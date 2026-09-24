import { general } from "./general";
import { money } from "./money";
import { admin } from "./admin";
import { server } from "./server";

// Bahasa Malaysia text, keyed by the exact English string used in the code.
// Split by area only to keep the files readable; they are merged here.
// Run `node scripts/check-i18n.mjs` to see what is still missing.
export const ms: Record<string, string> = { ...general, ...money, ...admin, ...server };
