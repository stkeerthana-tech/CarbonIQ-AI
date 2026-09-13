# Carboniq AI – Autonomous Carbon Intelligence & Verification Agent

A hackathon MVP backend for deterministic carbon accounting.  
Business activities → emission factor lookup → verified CO2e calculation → audit trail.

---

## 1. Project Overview

Carboniq AI accepts business activity data, retrieves a verified emission factor from a CSV knowledge base, performs a **deterministic numerical calculation** in Python, and returns the CO2e result with a complete audit trail.

The Lyzr AI layer handles **review, explanation, and recommendations** only.
The **backend always performs the final numbers** — the LLM is never permitted to invent or substitute an emission factor.

---

## 2. Architecture

```
User / Frontend
       │
       ▼
  Lyzr AI Agent  (review and explain verified context)
       │
       ▼
  Flask Backend  ◄──── emission_factors.csv (source of truth)
  ├── Validate input
  ├── Retrieve emission factor (CSV only)
  ├── Deterministic calculation (Python)
  ├── Write AuditRecord
  └── Return structured JSON
       │
       ▼
  SQLite Database
```

---

## 3. Technology Stack

| Component         | Technology                          |
|-------------------|-------------------------------------|
| Language          | Python 3.10+                        |
| Web framework     | Flask 3.x                           |
| ORM               | SQLAlchemy via Flask-SQLAlchemy     |
| Database          | SQLite (file: `backend/carboniq.db`)|
| Authentication    | Flask-JWT-Extended                  |
| CORS              | Flask-CORS                          |
| Emission factors  | pandas (CSV reader only)            |
| Environment vars  | python-dotenv                       |

---

## 4. Database Structure

### `users`
| Column        | Type    | Notes                              |
|---------------|---------|------------------------------------|
| id            | Integer | Primary key                        |
| name          | String  |                                    |
| email         | String  | Unique                             |
| password_hash | String  | Werkzeug pbkdf2:sha256             |
| role          | Enum    | admin / company_user / auditor     |
| created_at    | DateTime|                                    |

### `companies`
| Column       | Type    |
|--------------|---------|
| id           | Integer |
| company_name | String  |
| industry     | String  |
| location     | String  |
| created_at   | DateTime|

### `activity_records`
| Column     | Type    |
|------------|---------|
| id         | Integer |
| company_id | FK      |
| activity   | String  |
| quantity   | Float   |
| unit       | String  |
| date       | Date    |
| created_at | DateTime|

### `emission_results`
| Column       | Type   | Notes                              |
|--------------|--------|------------------------------------|
| id           | Integer|                                    |
| activity_id  | FK     |                                    |
| factor_id    | String | CSV factor_id                      |
| scope        | String | Scope 1 / 2 / 3                    |
| co2e_kg      | Float  | NULL when status = Needs Review    |
| co2e_tonnes  | Float  | NULL when status = Needs Review    |
| status       | String | "Calculated" or "Needs Review"     |
| calculation  | Text   | Human-readable formula             |
| source       | Text   |                                    |
| methodology  | Text   |                                    |
| review_reason| Text   |                                    |

### `audit_records`
| Column       | Type   | Notes                              |
|--------------|--------|------------------------------------|
| id           | Integer|                                    |
| emission_id  | FK     |                                    |
| activity_data| Text   | JSON snapshot of input             |
| factor_id    | String |                                    |
| factor_value | Float  |                                    |
| calculation  | Text   |                                    |
| source       | Text   |                                    |
| methodology  | Text   |                                    |
| status       | String |                                    |
| review_reason| Text   |                                    |
| timestamp    | DateTime|                                   |

---

## 5. API Endpoints

### Authentication
| Method | Endpoint            | Auth | Description                |
|--------|---------------------|------|----------------------------|
| POST   | /api/auth/register  | No   | Create account             |
| POST   | /api/auth/login     | No   | Obtain JWT token           |
| GET    | /api/auth/me        | JWT  | Current user profile       |

### Activities
| Method | Endpoint               | Auth | Description                      |
|--------|------------------------|------|----------------------------------|
| POST   | /api/activities        | JWT  | Submit activity + calculate      |
| GET    | /api/activities        | JWT  | List activities (?company_id=N)  |
| GET    | /api/activities/\<id\> | JWT  | Get single activity + audit      |

### Emissions
| Method | Endpoint                  | Auth | Description                    |
|--------|---------------------------|------|--------------------------------|
| POST   | /api/emissions/calculate  | JWT  | On-demand calculation preview  |

### Dashboard
| Method | Endpoint                     | Auth | Description             |
|--------|------------------------------|------|-------------------------|
| GET    | /api/dashboard/\<company_id\>| JWT  | Company-level totals    |

### Companies and AI
| Method | Endpoint                    | Auth | Description             |
|--------|-----------------------------|------|-------------------------|
| GET    | /api/health                 | No   | Health check            |
| GET    | /api/activities/supported   | No   | Supported activity list |
| GET    | /api/companies              | JWT  | List authorized companies|
| POST   | /api/ai/insights            | JWT  | Lyzr review of verified data |

---

## 6. Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/Carboniq-AI.git
cd Carboniq-AI

# 2. Create and activate a virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Set up backend environment variables
copy backend\.env.example backend\.env

# 5. Install frontend dependencies (in frontend/ folder)
cd frontend
npm install
copy .env.example .env
cd ..
```

---

## 7. How to Run

### Run Backend:
```bash
# Terminal 1 - from the project root (Carboniq-AI/)
python backend/app.py
```
The backend starts on `http://127.0.0.1:5000`.

### Run Frontend:
```bash
# Terminal 2 - from the project root (Carboniq-AI/)
cd frontend
npm run dev
```
The React frontend starts on `http://localhost:3000`.

---

## Live Demo

- Live application URL: deployment URL to be provided
- Demo role: Company User
- Demo email: `george@gmail.com`
- Demo password: CarbonIQ@Demo2026!
- Please provide these credentials securely to evaluators.

Demo access is provided through a dedicated Company User account for evaluation. The account is restricted to the demo organization and does not have administrator privileges. Administrative functions such as user management, organization management, and role assignment remain restricted to administrators.

---

## 8. Environment Variables

| Variable              | Required | Default                   | Description                      |
|-----------------------|----------|---------------------------|----------------------------------|
| SECRET_KEY            | Yes      | (set in environment)      | Flask session secret             |
| JWT_SECRET_KEY        | Yes      | (set in environment)      | JWT signing key                  |
| DATABASE_URI          | No       | sqlite:///carboniq.db     | SQLAlchemy database URI          |
| EMISSION_FACTORS_CSV  | No       | data/emission_factors.csv | Path to emission factors CSV     |
| FLASK_DEBUG           | No       | 1                         | Enable debug mode (set 0 in prod)|
| LYZR_API_KEY          | No       | (blank)                   | Backend-only Lyzr API key        |
| LYZR_AGENT_ID         | No       | (blank)                   | Backend-only Lyzr agent ID       |

---

## 9. Example API Requests

### Register
```bash
curl -X POST http://127.0.0.1:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"SecurePass1","role":"company_user"}'
```

### Login
```bash
curl -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SecurePass1"}'
```

### Calculate (on-demand, no persistence)
```bash
curl -X POST http://127.0.0.1:5000/api/emissions/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"activity":"Diesel combustion","quantity":2000,"unit":"litre","date":"2026-09-12"}'
```

### Submit activity (persisted + audit trail)
```bash
curl -X POST http://127.0.0.1:5000/api/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"company_id":1,"activity":"Diesel combustion","quantity":2000,"unit":"litre","date":"2026-09-12"}'
```

### Dashboard
```bash
curl http://127.0.0.1:5000/api/dashboard/1 \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 10. Carbon Calculation Methodology

```
co2e_kg    = quantity × co2e_factor   (factor in kg CO2e per unit)
co2e_tonnes = co2e_kg / 1000
```

Example – Diesel combustion, 2000 litres:
```
2000 litre × 2.72 kg CO2e/litre = 5440 kg CO2e = 5.44 tonnes CO2e
```

All calculations are performed in `backend/services/emission_calculator.py`.  
No LLM is involved in the arithmetic.

---

## 11. Emission Factor Source Handling

The CSV `data/emission_factors.csv` is the **single source of truth**.

Rules:
- If a valid `co2e_factor` exists → calculate deterministically.
- If `co2e_factor` is `NA` or missing → return `status = "Needs Review"`.
- Never label a CO2-only value as CO2e.
- Never invent or estimate a factor.
- The `source`, `source_year`, and `notes` columns are always returned with results.

---

## 12. Audit Trail

Every activity submission creates an `AuditRecord` with:

```
Activity input (JSON snapshot)
  → Emission factor (factor_id, factor_value, source)
    → Calculation formula (human-readable string)
      → Result (co2e_kg, co2e_tonnes, status)
        → Review reason (if Needs Review)
```

This trail is immutable once written and can be retrieved via `GET /api/activities/<id>`.

---

## 13. Workflow and AI Architecture

Company Users can enter and save activities for their assigned company, preview deterministic emissions, review Scope classification and Needs Review results, inspect anomaly flags, view Activity History and Audit Trail, and request a Lyzr AI carbon review. Auditors retain read-only access, while administrative operations remain restricted to administrators. Company-level RBAC isolates each non-admin user to explicitly assigned companies.

The deterministic backend is authoritative for emission factors, carbon calculations, database records, authorization, and audit records. Lyzr receives verified backend context to explain findings and provide recommendations; it does not replace calculations or invent missing emission factors.

```
User Input
    │
    ▼
[Lyzr AI Agent]
  • Review verified backend context
  • Explain findings in plain language
  • Provide recommendations
    │
    ▼
[Flask Backend – this repo]
  • Validate structured input
  • Look up emission factor from CSV
  • Perform deterministic calculation
  • Write audit record
  • Enforce company-level authorization
  • Return structured JSON
    │
    ▼
[Lyzr may explain the verified response for the user]
  • Must NOT modify co2e_kg or co2e_tonnes
  • Must NOT substitute an emission factor
```

The clean service boundary is `POST /api/emissions/calculate`.

---

## 14. Limitations

- SQLite is used for the MVP; replace with PostgreSQL for production.
- Anomaly detection uses a simple ratio method; a Z-score or IQR approach is better with more data.
- The emission factor database currently covers 6 activities and is India-region focused.
- Grid electricity and domestic air travel factors are CO2-only; they will always return "Needs Review" until CO2e factors are added to the CSV.
- Company-level isolation is enforced through explicit user-company assignments; administrators have global company access.
- This project does not claim compliance with CSRD, SEC, or any other regulation.

---

---

*Carboniq AI – Hackathon MVP*
