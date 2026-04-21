# Hotel Booking System (WebProject)

## Team Members
- Yerkinbek Oren
- Boranov Daniyar
- Assan Serikbay

---

A full‑stack hotel booking web application.

- **Frontend:** Angular (SPA)
- **Backend:** Django + Django REST Framework
- **Auth:** JWT (SimpleJWT)
- **Database (dev):** SQLite
- **Email:** SMTP notifications (password reset, booking updates, etc.)

---

## What’s inside

### User & authentication
- Register / Login / Logout (JWT)
- Profile: update **first name / last name / email**
- Change password
- **Forgot password**:
  - request reset link by email
  - reset password via the link
- Registration email notification (verification endpoint included)

### Hotel catalog
- Browse hotels & view hotel detail
- Rooms with price, capacity, amenities
- Availability search using dates + guests

### Bookings
- Create booking
- Cancel booking
- Dashboard summary (active bookings, totals, history)

### Email notifications (SMTP)
- Registration → confirmation email
- Booking created → email with booking details
- Booking cancelled → cancellation email
- Password reset → email with reset link

Email templates are in:
- `backend/api/templates/emails/` (both `.html` and `.txt`)

---

## Project structure

- `backend/` — Django project + REST API
  - `hotel_booking/` — settings/urls/wsgi/asgi
  - `api/` — models, serializers, views, email service, templates
- `frontend/` — Angular app
  - `src/app/pages/` — pages (hotels, dashboard, login, profile, forgot/reset password)

---

## API (backend)
Base URL (dev): `http://127.0.0.1:8000/api`

Main endpoints:

### Auth
- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/logout/`
- `GET  /auth/verify-email/?token=...`
- `POST /auth/password-reset/` (request reset link)
- `POST /auth/password-reset/confirm/` (set new password)

### User
- `GET /user/me/`
- `PUT /user/me/`
- `POST /user/change-password/`

### Catalog
- `GET /hotels/`
- `GET /hotels/{id}/`
- `GET /rooms/`
- `POST /availability/`

### Bookings
- `GET /dashboard/`
- `GET /bookings/`
- `POST /bookings/`
- `PUT /bookings/{id}/`
- `DELETE /bookings/{id}/` (cancel)

---

## How to run (macOS / zsh)

### 1) Backend (Django)

Open a terminal:

1. Go to backend:
   - `cd backend`
2. Activate virtualenv:
   - `source venv/bin/activate`
3. Install dependencies (if needed):
   - `pip install -r requirements.txt`

4. Configure SMTP (optional, but required for email features)
   - Copy `backend/.env.example` → `backend/.env`
   - Fill values for `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, etc.

5. Apply migrations:
   - `python manage.py migrate`

6. Seed demo data:
   - `python manage.py seed_demo_data`
   - Demo login: **demo / demo1234**

7. Start backend server:
   - `python manage.py runserver`

Backend URL:
- `http://127.0.0.1:8000/`

### 2) Frontend (Angular)

Open a second terminal:

1. Go to frontend:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm start`

Frontend URL:
- `http://localhost:4200/`

---

## SMTP notes (Gmail)
- Use a **Gmail App Password** (not the normal Gmail password)
- It may take a short time for emails to appear; also check **Spam/Promotions**

---

## Demo checklist
- Register → confirmation email sent
- Forgot password → reset email → reset form works
- Create booking → booking details email
- Cancel booking → cancellation email
