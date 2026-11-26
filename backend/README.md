# SurgRisk-AI Backend (Express + MongoDB)

## Database setup

Configure `backend/.env` with `MONGODB_URI` and `JWT_SECRET` (at least 32 characters), then run:

```bash
cd backend
npm install
npm run db:migrate
```

`npm run db:migrate` connects to MongoDB and synchronizes indexes for all Mongoose models (`User`, `PendingSignup`, `AdminAuditLog`, `Patient`, `PatientMedicalHistory`, `PatientComorbidity`, `PatientVitals`, `PatientSurgicalCase`, `PatientLabResult`, `PatientAuditLog`, `AiRiskAssessment`).

## Bootstrap the first administrator

Temporarily uncomment and populate the `BOOTSTRAP_ADMIN_*` variables in `backend/.env`, run:

```bash
npm run db:bootstrap-admin
```

Then remove the `BOOTSTRAP_ADMIN_*` credentials from `backend/.env`.

## 4. Frontend API configuration

Create or update the frontend `.env`:

```env
VITE_API_BASE=http://localhost:5000/api
```

Restart Vite after changing `.env`.

The existing `src/services/api.js` is retained and should already send the bearer token from localStorage.

## 5. Run both applications

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2 (project root):

```bash
npm run dev
```

Frontend routes:

- `/` — SurgRisk-AI landing page
- `/login` — clinician login
- `/register` — clinician registration and OTP verification
- `/app` — protected clinical workspace placeholder
- `/admin/clinicians` — admin-only review and role assignment

## 6. API contract

All routes are prefixed by `/api`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/signup/start` | Public | Start clinician registration and generate OTPs |
| POST | `/auth/signup/verify-otp` | Public | Verify both contact channels; account becomes `PENDING` |
| POST | `/auth/signup/resend-otp` | Public | Resend verification codes |
| POST | `/auth/login` | Public | Login only when account is approved and active |
| GET | `/auth/me` | Approved user | Get current user |
| GET | `/admin/clinicians/pending` | Admin | List pending applications |
| GET | `/admin/clinicians/approved` | Admin | List approved clinicians |
| PATCH | `/admin/clinicians/:userId/approval` | Admin | Approve or reject an application |
| PATCH | `/admin/clinicians/:userId/role` | Admin | Assign `CLINICIAN`, `SURGEON` or `ANESTHESIOLOGIST` |

### Signup start request

```json
{
  "firstName": "Asha",
  "middleName": "",
  "lastName": "Kulkarni",
  "email": "asha@example.com",
  "mobile": "+919876543210",
  "institution": "Example Hospital",
  "licenseNumber": "REG-12345",
  "password": "ChangeThisPassword123",
  "confirmPassword": "ChangeThisPassword123"
}
```

### Verify OTP request

```json
{
  "verificationId": "UUID_FROM_SIGNUP_START",
  "emailOtp": "123456",
  "mobileOtp": "654321"
}
```

The successful verification response contains `data.user` and `data.requiresApproval`. It deliberately does not issue a JWT before administrator approval.

### Login request

```json
{
  "credential": "asha@example.com",
  "password": "ChangeThisPassword123"
}
```

Successful responses use the envelope `{ "success": true, "data": { "token": "...", "user": { ... } } }`.

### Admin approval request

```json
{ "status": "APPROVED" }
```

### Admin role request

```json
{ "role": "SURGEON" }
```

## 7. Local OTP behaviour

The Phase 1 development OTP adapter prints codes to the backend terminal only. It does not send real email or SMS. Configure verified email and SMS providers before production use.

## 8. Important security notes

- The first admin bootstrap is a privileged local/server operation. Run it once and remove its environment variables afterward.
- Review professional license details independently before approving an account or assigning a specialist role. OTP proves control of contact channels, not medical credentials.
- The frontend stores the bearer token in localStorage to remain compatible with the Phase 1 Axios interceptor. For deployment with clinical data, evaluate HttpOnly secure cookies or another hardened session design, CSRF protections as appropriate, short-lived access tokens/refresh strategy, CSP, audit logging, secret rotation, encryption, backups and security testing.
- Do not use real patient data until the application has undergone the required privacy, security and clinical validation.
- This is a development integration phase, not a certified medical device or production-ready clinical system.
