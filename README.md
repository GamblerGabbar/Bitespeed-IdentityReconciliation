# Bitespeed Identity Reconciliation

A web service that identifies and consolidates customer contact information across multiple purchases.

## 🚀 Live API

**Base URL:** https://bitespeed-identityreconciliation.onrender.com/

**Endpoint:** `POST /identify`

## 📋 Quick Start

### Request
```json
{
  "email": "example@email.com",
  "phoneNumber": "1234567890"
}
```

### Response
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["example@email.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}
```

## 🛠️ Tech Stack

- **Backend:** Node.js with TypeScript
- **Database:** PostgreSQL
- **Framework:** Express.js
- **Hosting:** Render.com

## 💻 Local Setup

```bash
# Clone repository
git clone https://github.com/GamblerGabbar/Bitespeed-IdentityReconciliation.git

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run dev
```

## 📝 Features

- Links contacts by email or phone number
- Maintains primary-secondary relationships
- Consolidates multiple customer identities
- Handles complex linking scenarios

## 🔗 Repository

GitHub: https://github.com/GamblerGabbar/Bitespeed-IdentityReconciliation

---

**Note:** At least one of `email` or `phoneNumber` must be provided in the request.