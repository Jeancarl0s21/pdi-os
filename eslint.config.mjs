import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/.next/**", "**/node_modules/**", "playwright-report/**", "test-results/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mjs"],
    rules: {
      "no-console": "off"
    }
  }
];
