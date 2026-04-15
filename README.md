# MediCore — Patient Record System
### Assignment #9 | BEDIBOUNE ALIMOKA DEBORAH | AICS

---

## 📋 Project Overview
A complete, full-stack Patient Record System built with HTML/CSS/JavaScript (frontend) and PHP/MySQL (backend).

---

## 🗂 Project Structure
```
patient-record-system/
├── index.html              ← Main frontend (all 6 screens)
├── css/
│   └── style.css           ← Full styling (dark theme, animations)
├── js/
│   └── app.js              ← All frontend logic (API calls, UI)
├── php/
│   ├── config.php          ← DB connection + helpers
│   └── api.php             ← REST API (all endpoints)
└── database.sql            ← Full DB schema + seed data
```

---

## ⚙️ Setup Instructions (Laragon)

### Step 1 — Copy files
Place the entire `patient-record-system/` folder in:
```
C:\laragon\www\patient-record-system\
```

### Step 2 — Create the Database
1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click **"New"** to create a database named `patient_record_db`
3. Select the database, go to **SQL** tab
4. Open `database.sql`, copy everything, paste and click **Go**

### Step 3 — (Optional) Check DB credentials
Open `php/config.php` and verify:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');           // Change if you set a password
define('DB_NAME', 'patient_record_db');
```

### Step 4 — Run the app
Go to: `http://localhost/patient-record-system/`

---

## 🔐 Login Credentials
| Username | Password | Role |
|----------|----------|------|
| admin | password | Administrator |
| dr.morgan | password | Doctor |
| nurse.chen | password | Nurse |

> ⚠️ The seed password hash in the SQL matches the string `password` using PHP's `password_hash()`.

---

## ✅ Implemented Screens

| # | Screen | Status |
|---|--------|--------|
| 1 | Login Screen | ✅ Complete |
| 2 | Records List (searchable, filterable) | ✅ Complete |
| 3 | Add Record (multi-section patient form) | ✅ Complete |
| 4 | Reports (charts, analytics) | ✅ Complete |
| 5 | History (full audit log) | ✅ Complete |
| 6 | Profile + Requirements Checklist | ✅ Complete |

---

## 🌟 Features
- 🔒 Session-based authentication
- 🔍 Real-time search + status filter
- 📊 Visual bar charts for analytics
- 🗂 Full CRUD for patients and medical records
- 📋 Audit trail for all actions
- 📱 Fully responsive (mobile-friendly)
- ✨ Smooth animations & modern dark UI

---

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | PHP 8.x |
| Database | MySQL (via Laragon) |
| Fonts | Sora, JetBrains Mono |
| Local Server | Laragon |
