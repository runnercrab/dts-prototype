import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // --------------------------------------------------
  // Base Next.js + TypeScript (oficial)
  // --------------------------------------------------
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // --------------------------------------------------
  // 1) Ignorar carpetas/archivos que NO deben lintarse
  // --------------------------------------------------
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",

      // ruido histórico / backups
      "backups/**",
      "src/_trash/**",
      "**/*.backup-*",
      "**/*.bak",
    ],
  },

  // --------------------------------------------------
  // 2) APIs backend → permitir `any` (normal en JSON/DB)
  // --------------------------------------------------
  {
    files: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // --------------------------------------------------
  // 3) MODO MVP / TURBO
  //    UI, componentes, hooks, lib, debug
  //    (temporal, para no frenar el producto)
  // --------------------------------------------------
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // --------------------------------------------------
  // 4) Permitir comentarios TS temporales
  //    (@ts-ignore / @ts-expect-error)
  // --------------------------------------------------
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },

  // --------------------------------------------------
  // 5) Relajar reglas React que ahora solo meten ruido
  // --------------------------------------------------
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
