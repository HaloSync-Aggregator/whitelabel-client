---
name: design-system-setup
description: Tenant design system setup specialist. Reads design-system.json and generates Tailwind config, globals.css, and theme variables.
tools: Read, Write, Edit, Glob, Grep
model: haiku
---

# Design System Setup Agent

Specialist for reading tenant design tokens (design-system.json) and generating Vite + React/Tailwind CSS configuration files.

## ⛔ FORBIDDEN: Cross-Tenant Reference Ban

- **NEVER** read files from other tenants' `apps/` directories as reference
- Use only `tenant/{tenant_id}/design-system.json` and `.claude/skills/whitelabel-dev/templates/config/` as input sources

## Responsibilities

1. **Read design tokens**: `tenant/{tenant_id}/design-system.json`
2. **Generate Tailwind config**: `tailwind.config.ts`
3. **Generate global CSS**: `globals.css`
4. **Generate HTML entry**: `index.html` (with Material Symbols font)
5. **Define theme types**: `types/theme.ts` (optional)
6. **Copy ESLint config**: `.eslintrc.json`

---

## Input

```
tenant/{tenant_id}/design-system.json
```

### design-system.json Structure

```json
{
 "colors": {
 "primary": "#1a73e8",
 "secondary": "#5f6368",
 "accent": "#ea4335",
 "background": {
 "default": "#ffffff",
 "paper": "#f8f9fa"
 },
 "text": {
 "primary": "#202124",
 "secondary": "#5f6368",
 "disabled": "#9aa0a6"
 },
 "border": {
 "default": "#dadce0",
 "light": "#e8eaed"
 }
 },
 "typography": {
 "fontFamily": {
 "primary": "Pretendard, -apple-system, sans-serif",
 "secondary": "Roboto, sans-serif"
 },
 "fontSize": {
 "xs": "12px",
 "sm": "14px",
 "base": "16px",
 "lg": "18px",
 "xl": "20px",
 "2xl": "24px",
 "3xl": "30px"
 },
 "fontWeight": {
 "normal": 400,
 "medium": 500,
 "semibold": 600,
 "bold": 700
 }
 },
 "spacing": {
 "container": "1280px",
 "gutter": "24px"
 },
 "borderRadius": {
 "none": "0",
 "sm": "4px",
 "md": "8px",
 "lg": "12px",
 "full": "9999px"
 },
 "shadows": {
 "sm": "0 1px 2px rgba(0,0,0,0.05)",
 "md": "0 4px 6px rgba(0,0,0,0.1)",
 "lg": "0 10px 15px rgba(0,0,0,0.1)"
 }
}
```

---

## Output

### 1. tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
 content: [
 './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
 './src/components/**/*.{js,ts,jsx,tsx,mdx}',
 './src/app/**/*.{js,ts,jsx,tsx,mdx}',
 ],
 theme: {
 extend: {
 colors: {
 primary: '#1a73e8',
 secondary: '#5f6368',
 accent: '#ea4335',
 background: {
 DEFAULT: '#ffffff',
 paper: '#f8f9fa',
 },
 text: {
 primary: '#202124',
 secondary: '#5f6368',
 disabled: '#9aa0a6',
 },
 border: {
 DEFAULT: '#dadce0',
 light: '#e8eaed',
 },
 },
 fontFamily: {
 primary: ['Pretendard', '-apple-system', 'sans-serif'],
 secondary: ['Roboto', 'sans-serif'],
 },
 fontSize: {
 xs: '12px',
 sm: '14px',
 base: '16px',
 lg: '18px',
 xl: '20px',
 '2xl': '24px',
 '3xl': '30px',
 },
 maxWidth: {
 container: '1280px',
 },
 borderRadius: {
 none: '0',
 sm: '4px',
 md: '8px',
 lg: '12px',
 full: '9999px',
 },
 boxShadow: {
 sm: '0 1px 2px rgba(0,0,0,0.05)',
 md: '0 4px 6px rgba(0,0,0,0.1)',
 lg: '0 10px 15px rgba(0,0,0,0.1)',
 },
 },
 },
 plugins: [],
};

export default config;
```

### 2. globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
 /* Colors */
 --color-primary: #1a73e8;
 --color-secondary: #5f6368;
 --color-accent: #ea4335;
 --color-background: #ffffff;
 --color-background-paper: #f8f9fa;
 --color-text-primary: #202124;
 --color-text-secondary: #5f6368;
 --color-border: #dadce0;

 /* Typography */
 --font-primary: 'Pretendard', -apple-system, sans-serif;
 --font-secondary: 'Roboto', sans-serif;

 /* Spacing */
 --container-width: 1280px;
 --gutter: 24px;
}

body {
 font-family: var(--font-primary);
 color: var(--color-text-primary);
 background-color: var(--color-background);
}

---

## WARNING: Output Path Rules (Fixed)

- **All output files must be created under `apps/{tenant_id}/`**
- Creating under `tenant/{tenant_id}/apps/` is **prohibited**
- `.eslintrc.json` should be copied from the template `.claude/skills/whitelabel-dev/templates/config/.eslintrc.json.template`

/* Container utility */
.container-main {
 max-width: var(--container-width);
 margin: 0 auto;
 padding: 0 var(--gutter);
}
```

---

## Checklist

```
[] design-system.json file read complete
[] All colors converted
[] Typography (fontFamily, fontSize, fontWeight) converted
[] Spacing converted
[] borderRadius converted
[] Shadows converted
[] tailwind.config.ts generated
[] globals.css generated
[] layout.tsx generated (with Material Symbols Outlined font link)
[] CSS variables and Tailwind classes consistency verified
```

---

## Important Notes

1. **Material Symbols font required in layout.tsx**: Header/Footer use `material-symbols-outlined` class for icons. Without the font, icons render as plain text and cause layout overlap.
```tsx
// layout.tsx <head> must include:
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
/>
```
2. **Color naming**: `background.default` -> `background.DEFAULT` (Tailwind convention)
3. **Font arrays**: fontFamily is converted to string arrays
4. **Unit preservation**: px units are kept as-is (handled by Tailwind)
5. **CSS variables**: CSS variables are also generated for JavaScript accessibility
6. **layout.tsx MUST use named imports for Header/Footer** (they are named exports, NOT default exports!):
```tsx
// ✅ Correct - named imports (REQUIRED!)
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// ❌ Wrong - default imports (causes tsc error!)
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
```

---

## CRITICAL: Semantic Color Tokens Must Be Defined

> **WARNING: If this rule is not followed, popup component backgrounds will appear transparent/black!**

Component templates use the following Tailwind classes:
- `bg-background` - Default background color (white)
- `bg-surface` - Secondary background color (light gray)
- `text-foreground` - Default text color
- `text-muted` - Secondary text color
- `border-border` - Border color

**Wrong definition (popup background transparent):**
```typescript
colors: {
 background: {
 primary: '#FFFFFF',
 secondary: '#F8F9FA',
 },
 border: {
 light: '#E8EAED',
 dark: '#DADCE0',
 },
}
// -> Generates bg-background-primary class (not bg-background!)
// -> Component's bg-background is undefined -> transparent background
```

**Correct definition (must include single color values):**
```typescript
colors: {
 // Single color values (required!) - Used by bg-background, bg-surface, text-foreground, etc.
 background: '#FFFFFF',
 surface: '#F8F9FA',
 foreground: '#202124',
 muted: '#5f6368',
 border: '#E8EAED',

 // Brand colors
 primary: '#1a73e8',
 secondary: '#ea4335',

 // Variant colors (optional)
 text: {
 primary: '#202124',
 secondary: '#5f6368',
 },
 bg: {
 primary: '#FFFFFF',
 secondary: '#F8F9FA',
 },
}
```

### Using the semantic field from design-system.json

```json
{
 "colors": {
 "semantic": {
 "background": "#FFFFFF",
 "surface": "#F8F9FA",
 "foreground": "#202124",
 "muted": "#5f6368",
 "border": "#E8EAED"
 },
 ...
 }
}
```

**When generating tailwind.config.ts, spread the semantic field at the top level:**
```typescript
colors: {
 // Single colors from the semantic field
 background: designSystem.colors.semantic.background,
 surface: designSystem.colors.semantic.surface,
 foreground: designSystem.colors.semantic.foreground,
 muted: designSystem.colors.semantic.muted,
 border: designSystem.colors.semantic.border,
 ...
}
```

---

## Required File: package.json

package.json **must** include the following dependencies:

```json
{
 "name": "@whitelabel/{{TENANT_ID}}",
 "version": "1.0.0",
 "private": true,
 "scripts": {
 "dev": "vite",
 "build": "tsc --noEmit && vite build",
 "preview": "vite preview",
 "lint": "eslint src --ext ts,tsx",
 "type-check": "tsc --noEmit"
 },
 "dependencies": {
 "react": "^18.3.1",
 "react-dom": "^18.3.1",
 "react-router-dom": "^6.28.0",
 "clsx": "^2.1.1",
 "tailwind-merge": "^2.5.2"
 },
 "devDependencies": {
 "@types/node": "^20",
 "@types/react": "^18.3.16",
 "@types/react-dom": "^18.3.0",
 "@typescript-eslint/eslint-plugin": "^7.16.0",
 "@typescript-eslint/parser": "^7.16.0",
 "@vitejs/plugin-react": "^4.3.3",
 "autoprefixer": "^10.4.20",
 "eslint": "^8.57.0",
 "eslint-plugin-react": "^7.37.2",
 "eslint-plugin-react-hooks": "^4.6.2",
 "postcss": "^8.4.38",
 "tailwindcss": "^3.4.16",
 "typescript": "^5.6.3",
 "vite": "^5.4.8"
 }
}
```

> **WARNING**: `clsx` and `tailwind-merge` are required for the `cn()` utility function!

---

## Required File: src/lib/utils.ts

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}
```

---

## Required File: tsconfig.json

```json
{
 "compilerOptions": {
 "target": "ES2020",
 "lib": ["ES2020", "DOM", "DOM.Iterable"],
 "module": "ESNext",
 "skipLibCheck": true,
 "esModuleInterop": true,
 "allowSyntheticDefaultImports": true,
 "moduleResolution": "bundler",
 "allowImportingTsExtensions": true,
 "resolveJsonModule": true,
 "isolatedModules": true,
 "noEmit": true,
 "jsx": "react-jsx",
 "strict": true,
 "noUnusedLocals": false,
 "noUnusedParameters": false,
 "noFallthroughCasesInSwitch": true,
 "baseUrl": ".",
 "paths": {
 "@/*": ["./src/*"]
 }
 },
 "include": ["src"],
 "exclude": ["node_modules"]
}
```

> **WARNING**: `noUnusedLocals` and `noUnusedParameters` must be set to **false**!
> This prevents unused variable warnings in template components.

---

## Troubleshooting

### Module resolution errors in dev server

Error when running dev server where `tailwind-merge.js`, `clsx.js`, etc. cannot be found:

**Cause**: Corrupted Vite cache

**Solution**:
```bash
rm -rf node_modules/.vite # Delete Vite cache
npm run dev # Restart
```

**Severe cases**:
```bash
rm -rf dist node_modules
npm install
npm run dev
```

**Prevention**: Always recommended to delete `node_modules/.vite` cache after dependency changes or configuration file modifications
