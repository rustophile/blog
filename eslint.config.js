import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default defineConfig(
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs["jsx-a11y-recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  // keep last: turns off rules that conflict with Prettier
  eslintConfigPrettier,
);
