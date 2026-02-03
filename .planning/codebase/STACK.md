# Technology Stack

**Analysis Date:** 2026-02-03

## Languages

**Primary:**
- TypeScript 5.7.2 - Full codebase including React components, Convex backend, and configuration

**Secondary:**
- JavaScript - Configuration files and build tools
- CSS - Styling via Tailwind CSS

## Runtime

**Environment:**
- Node.js (inferred from package.json type: "module" and ESM usage)

**Package Manager:**
- Bun (indicated by bun.lock lockfile)

## Frameworks

**Core Frontend:**
- React 19.2.0 - UI library
- TanStack React Router 1.132.0 - Client and server-side routing
- TanStack React Start 1.132.0 - Full-stack meta-framework for routing and SSR

**Styling:**
- Tailwind CSS 4.0.6 - Utility-first CSS framework
- Class Variance Authority 0.7.1 - Component variant management
- Tailwind Merge 3.0.2 - Utility class merging utility

**UI Components:**
- Radix UI 1.4.3 - Unstyled, accessible component primitives
- Lucide React 0.561.0 - Icon library

**Forms & Data:**
- TanStack React Form 1.0.0 - Form state management
- TanStack React Query 5.66.5 - Server state management and data fetching
- Zod 4.1.11 - Runtime schema validation

**Backend:**
- Convex 1.27.3 - Serverless backend with real-time database
- Nitro (nightly) - Server runtime for API routes and SSR

**Testing:**
- Vitest 3.0.5 - Unit/integration test runner
- Testing Library React 16.2.0 - React component testing utilities
- Testing Library DOM 10.4.0 - DOM testing utilities
- jsdom 27.0.0 - DOM implementation for Node.js

**Build & Dev:**
- Vite 7.1.7 - Build tool and dev server
- TanStack Router Plugin 1.132.0 - File-based routing Vite plugin
- TanStack DevTools Vite 0.3.11 - Debug panel for TanStack tools

**Code Quality:**
- Biome 2.2.4 - Linter and formatter

**Development Tools:**
- TanStack React DevTools 0.7.0 - React debugging panel
- TanStack React Router DevTools 1.132.0 - Router debugging panel
- TanStack React Query DevTools 5.84.2 - Query debugging panel
- React Compiler (Babel plugin 1.0.0) - Optimizing compiler for React

**Utilities:**
- @t3-oss/env-core 0.13.8 - Type-safe environment variable validation
- Vite TypeScript Config Paths 6.0.2 - TypeScript path alias resolution
- Clsx 2.1.1 - Classname utility
- Faker 10.0.0 - Fake data generation for demos

## Configuration

**TypeScript:**
- Target: ES2022
- JSX: react-jsx
- Module Resolution: bundler
- Strict mode enabled
- Path aliases: `@/*` → `./src/*`
- Config file: `tsconfig.json`

**Build:**
- Vite config: `vite.config.ts`
- React plugins: @vitejs/plugin-react with Babel compiler
- Nitro/Nightly for server runtime
- Tailwind CSS Vite plugin
- TanStack Router file-based routing plugin
- DevTools Vite integration

**Code Quality:**
- Biome config: `biome.json`
- Formatter: Tab indentation, double quotes for JavaScript
- Linter: Recommended rules enabled
- VCS integration: Disabled
- Import organization: Enabled via Biome assist

**Environment:**
- Vite loads from `import.meta.env`
- Env validation: `@t3-oss/env-core` in `src/env.ts`
- Required client vars prefixed with `VITE_`
- Config: `.env.local`

## Platform Requirements

**Development:**
- Node.js with ESM support
- Bun package manager
- TypeScript 5.7.2+

**Production:**
- Deployment: Convex serverless backend (specified in `.env.local`)
- Frontend: Can be deployed to any static host or SSR-capable platform
- Convex Cloud hosting for backend functions and database

---

*Stack analysis: 2026-02-03*
