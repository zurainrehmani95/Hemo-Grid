# HemoGrid 🩸

> *"Your blood is precious: Share it, save a life."* — the login screen, being dramatic on purpose

**HemoGrid** is a blood bank admin portal I built because spreadsheets deserve better and also because PS3 menu vibes never went out of style. You log in, you manage donors, you pretend you're running a whole hospital wing from one dashboard. It's giving corporate blood bank energy but make it aesthetic.

Live-ish on the internet. Slow sometimes. Free tier things. Still works. We love that journey.

---

## What even is this?

Imagine a control room for a blood bank — but instead of beige walls and fax machines, you get:

- A **login portal** with flowing ribbon waves (yes, like the old PlayStation menu — no, I will not apologize)
- A **Donor Registry** where you hunt down donors by blood group from A+ to O-
- A **Statistics Matrix** because numbers look cooler when they're in a matrix
- A **Ledger & Cash Flow** tab for audit trails (the app remembers who did what)
- **Control Settings** to flip between dark and light mode (dark is the default because we're not animals)

Authorized personnel only. The UI says so in red. Very serious. Very cool.

---

## The stack (the boring but important part)

| Layer | What's running |
|-------|----------------|
| **Frontend** | React 19 + Vite + React Router |
| **Backend** | ASP.NET Core 9 (`BloodBankAPI`) |
| **Database** | MySQL |
| **Auth** | JWT tokens + BCrypt password hashes (passwords don't live in the frontend, we're civilized) |

Locally the frontend hangs out on port **5173** and the API on **5236**. In production the frontend lives on **Vercel** and the API + database camp out on **Railway**. No custom domain — just the free `*.vercel.app` and `*.railway.app` URLs like nature intended.

---

## Folder layout (where the bodies are buried)

```
Blood bank/
├── blood-bank-ui/     ← React frontend, the pretty face
├── BloodBankAPI/      ← .NET API, the brain
└── HemoGrid-Vault/    ← My personal notes (gitignored, stays on my machine)
```

`HemoGrid-Vault/` never touches GitHub. That's my Obsidian diary. You wouldn't understand. (It's project notes.)

Secrets live in `appsettings.json` locally — also gitignored. The repo only ships `appsettings.example.json` with placeholders. We're not posting passwords to the internet like it's 2009.

---

## Features worth mentioning

### Login portal
PS3 XMB-style animated wave background. Canvas ribbons. Floating particles. It eats a bit of GPU for the ✨vibes✨. Worth it.

### Donor Registry
Search and filter donors by blood group. Add, edit, delete. Full CRUD energy. The API seeds dummy donors on first run so the table isn't sad and empty.

### Statistics Matrix
Charts and distribution stuff. Makes you look productive in screenshots.

### Ledger & Cash Flow
Audit trail for auth events and donor operations. Big brother but for blood bank admins.

### Control Settings
Light/dark theme toggle. Dark mode supremacy.

### Sidebar emergency desk
There's a phone number on the sidebar for emergencies. It's hardcoded. Very professional. Very permanent.

---

## How auth works (quick lore drop)

1. You post username + password to `/api/auth/login`
2. API checks the `admins` table in MySQL, verifies the BCrypt hash
3. You get a JWT back
4. Frontend stores it in `sessionStorage` and sends `Authorization: Bearer ...` on every request
5. If the token expires or lies, you get yeeted back to login

Login is rate-limited to 5 attempts per minute per IP because brute force is cringe.

---

## API endpoints (for the curious)

| Method | Route | What it does |
|--------|-------|--------------|
| `POST` | `/api/auth/login` | Login, get JWT |
| `GET` | `/api/donors` | List / search donors |
| `POST` | `/api/donors` | Birth a new donor record |
| `PUT` | `/api/donors/{id}` | Fix someone's info |
| `DELETE` | `/api/donors/{id}` | Remove a donor |
| `GET` | `/api/health` | "Is the API alive?" |
| `GET` | `/api/health/db` | "Is MySQL alive and did we seed the admin?" |

Protected routes need a valid bearer token. No token, no donors. Them's the rules.

---

## Under the hood

- **AdminSeeder** — makes sure an admin exists in MySQL on startup
- **DonorSeeder** — drops in sample donors across every blood group (idempotent, won't duplicate)
- **DatabaseBootstrap** — creates tables on first Railway deploy because empty MySQL is useless
- **JwtTokenService** — signs tokens so fake logins don't work
- **PasswordHasher** — BCrypt, because storing plain text passwords is a war crime

The frontend's `App.jsx` is the container — it owns state and API calls. Components in `/components` are mostly just vibing and rendering.

---

## Deployment lore (not a tutorial, just facts)

This thing is a **monorepo** — one GitHub repo, two apps:

- `blood-bank-ui` → Vercel (root directory set to that folder)
- `BloodBankAPI` → Railway (root directory set to that folder)

Railway also hosts MySQL. The API connects via `MYSQL_URL`. CORS allows `*.vercel.app` origins because life is too short to update the URL every preview deploy.

First load on free Railway can be slow. Cold starts. The API was napping. It needs a minute to wake up and remember it has a job. Singapore region helps. Patience helps more.

---

## Disclaimers (lawyer voice but goofy)

- **Not for real patient data.** Portfolio / demo / class project energy.
- **Don't commit secrets.** They're gitignored for a reason.
- **Change default passwords** before showing the link to strangers.
- **Free hosting** means janky URLs and occasional slowness. That's the tax.

---

## Credits & vibes

Built by **Muhammad Zurain Rehmani**. Brand name in the UI: **HEMOGRID**. Emergency desk number in the sidebar if you need to yell at someone.

If you fork this: cool. If you break it: also cool, we've all been there. If it works first try: suspicious.

🩸 *Stay eligible. Donate if you can. Hydrate always.*
