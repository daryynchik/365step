import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The React Compiler rules flag effects that sync with browser APIs
    // (speech, three.js, Desmos, localStorage). They work as written; kept as
    // warnings until those components are reworked.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "data/**", "next-env.d.ts"]),
]);
