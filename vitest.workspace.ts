import { defineWorkspace } from "vitest/config";

/**
 * Every package that ships domain logic registers its test project here.
 * UI packages are intentionally absent: they are presentational and are
 * covered through the modules that consume them.
 */
export default defineWorkspace(["packages/core"]);
