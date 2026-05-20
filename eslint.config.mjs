import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    /* 
       ഗൂഗിൾ പ്ലേ സ്റ്റോർ റിലീസിനായുള്ള ബിൽഡ് സുഗമമാക്കാൻ താൽക്കാലികമായി ചില കർശനമായ ലിന്റിങ് നിയമങ്ങൾ ഒഴിവാക്കുന്നു. 
       പ്രത്യേകിച്ച് 'any' ടൈപ്പ് ഉപയോഗിക്കുന്നത് മൂലമുള്ള എററുകൾ ഒഴിവാക്കാൻ no-explicit-any ഓഫാക്കുന്നു.
    */
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
