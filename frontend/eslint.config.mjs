import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals", 
    "next/typescript",
    "@typescript-eslint/recommended",
    "prettier"
  ),
  {
    plugins: ["prettier"],
    rules: {
      // Prettier integration
      "prettier/prettier": "error",
      
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-const": "error",
      "@typescript-eslint/no-var-requires": "error",
      
      // React specific rules
      "react/jsx-boolean-value": "error",
      "react/jsx-curly-brace-presence": ["error", "never"],
      "react/self-closing-comp": "error",
      "react/jsx-sort-props": ["error", { "callbacksLast": true, "reservedFirst": true }],
      
      // General code quality
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      
      // Import organization
      "import/order": [
        "error",
        {
          "groups": [
            "builtin",
            "external", 
            "internal",
            "parent",
            "sibling",
            "index"
          ],
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          }
        }
      ],
    },
  },
  {
    ignores: [
      ".next/",
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "*.config.js",
      "*.config.mjs",
    ],
  },
];

export default eslintConfig;
