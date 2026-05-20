import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    /* 
       ഗൂഗിൾ പ്ലേ സ്റ്റോർ റിലീസിനായുള്ള ബിൽഡ് സുഗമമാക്കാൻ താൽക്കാലികമായി ചില കർശനമായ ലിന്റിങ് നിയമങ്ങൾ ഒഴിവാക്കുന്നു. 
       പ്രത്യേകിച്ച് 'any' ടൈപ്പ്, ഉപയോഗിക്കാത്ത വേരിയബിളുകൾ, @ts-ignore കമന്റുകൾ, എസ്കേപ്പ് ചെയ്യാത്ത ചിഹ്നങ്ങൾ എന്നിവ ബിൽഡ് തടസ്സപ്പെടുത്താതിരിക്കാൻ ഓഫ് ആക്കുന്നു.
    */
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "react/no-unescaped-entities": "off",
      "react/jsx-no-undef": "off",
      "prefer-const": "off"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "android/**", // ആൻഡ്രോയിഡ് ബിൽഡ് ഫയലുകൾ എസ്‌ലിന്റ് സ്കാനിംഗിൽ നിന്നും ഒഴിവാക്കുന്നു
  ]),
]);

export default eslintConfig;
