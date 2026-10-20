# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Environment variables

Copy `.env.example` to `.env` and fill in the values. Only `VITE_API_BASE_URL` is read by the app:

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the tour-trip API, no trailing slash (e.g. `http://localhost:8000/api`). When empty, `authService` falls back to the built-in mock login. |

API requests go through the shared client in `src/services/httpClient.js` (JSON headers, Bearer token from the stored session, `{ success, message, data }` unwrapping, normalized `{ status, message, errors }` errors, 401 -> logout + redirect to `/login`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint with oxlint |
| `npm run test` | Run unit tests (Vitest) |

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
