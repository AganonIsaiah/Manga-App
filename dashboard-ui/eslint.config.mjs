import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".angular/**",
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "out-tsc/**",
    ],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/prefer-inject": "error",
      "@angular-eslint/component-max-inline-declarations": [
        "error",
        { template: 0 },
      ],
      "@angular-eslint/component-class-suffix": "off",
      "@angular-eslint/directive-class-suffix": "off",
    },
  },
  { files: ["**/*.html"], extends: [...angular.configs.templateRecommended] },
);
