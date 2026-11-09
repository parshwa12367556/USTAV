# Frontend architecture

## Stack

The web client uses React 19, TypeScript, Vite, React Router, Axios, TanStack Query, React Hook Form, and Zod. Dependencies and scripts are listed in `frontend/package.json`.

## Structure

- `src/routes`: route hierarchy and protected route handling.
- `src/pages`: routed screens and workflow pages.
- `src/features`: feature-specific API clients and components.
- `src/services/api/apiClient.ts`: shared Axios instance, access-token header, CSRF, refresh/retry behavior.
- `src/services/storage/tokenStorage.ts`: in-memory access token and CSRF token handling.
- `src/context/AuthContext.tsx`: authenticated user, active role/membership, permissions, sign-out, and private cache clearing.
- `src/types`: frontend API/domain types.

## Authentication behavior

Access tokens are kept in JavaScript memory rather than local storage. Refresh tokens are HttpOnly cookies; cookies and API must be configured for the deployed origin, HTTPS, CORS, and SameSite policy. On a 401, the API client attempts one refresh and retries eligible requests. On refresh failure it clears token state and notifies the auth provider.

Frontend role checks hide or route UI. They are not security controls: sensitive data and mutations must remain authorized by backend endpoints.

## State and caching

TanStack Query is used for shared request caching; auth transitions clear the query client and selected browser-local private data. Check every newly added store/cache for identity scoping and logout cleanup.

## Build and verification

Run `npm run build` in `frontend/`; this executes TypeScript project checks and Vite production bundling. No frontend test or lint script is declared in `package.json` at this time.