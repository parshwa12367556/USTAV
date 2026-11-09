# Local development setup

## Prerequisites

- Python version compatible with the project’s backend dependencies.
- Node.js/npm compatible with the frontend lockfile.
- Git.

## Backend (PowerShell)

```powershell
Set-Location D:\UTSAV\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set different random local-only values for `SECRET_KEY` and `JWT_SECRET_KEY` in `backend/.env`; set the SQLite URL and allowed local origins. Do not share or commit `.env`. Then:

```powershell
flask --app run db upgrade
python run.py
```

API health endpoints: `http://127.0.0.1:5000/health` and `http://127.0.0.1:5000/api/v1/health`.

## Frontend (second terminal)

```powershell
Set-Location D:\UTSAV\frontend
npm ci
npm run dev
```

The API base defaults to `http://localhost:5000/api/v1`. Override it with `VITE_API_BASE_URL` when needed, ensuring the backend CORS allowlist exactly includes the frontend origin.

## Email, MFA, and payment development

- Email verification/reset require a delivery configuration. Use a private local mail sink; do not log codes or use production mail credentials.
- Admin TOTP requires a valid `TOTP_ENCRYPTION_KEY`; use a throwaway local key and maintain it for the lifetime of that local database’s MFA secret.
- Razorpay checkout is unavailable unless local provider credentials are configured. Never put secret credentials in frontend variables; only public provider configuration may reach the client.

## Tests

```powershell
Set-Location D:\UTSAV\backend
python -m pytest
Set-Location D:\UTSAV\frontend
npm run build
```

Tests use isolated databases; never point tests or migrations at a database containing production or valuable local data.

## Troubleshooting

- If database URI is wrong, inspect `DATABASE_URL`; local relative SQLite paths resolve under `backend`.
- If browser requests fail, compare frontend origin, `CORS_ORIGINS`, cookie SameSite/Secure settings, and API base URL.
- A 401 on initial `/auth/me` before login is expected when no session exists.
- Do not resolve auth errors by disabling CSRF, JWT checks, or membership permissions.