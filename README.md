# Backend Stage 1 — Profiles API

A REST API that accepts a name, classifies it using Genderize, Agify, and Nationalize APIs, stores the result in PostgreSQL, and exposes endpoints to manage profiles.

## Base URL
```
https://yourapp.up.railway.app
```

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/profiles | Create a profile |
| GET | /api/profiles | Get all profiles |
| GET | /api/profiles/:id | Get single profile |
| DELETE | /api/profiles/:id | Delete a profile |

## Example Request
```
POST /api/profiles
Content-Type: application/json

{ "name": "john" }
```

## Setup
```bash
npm install
npx prisma generate
npm run dev
```

## Environment Variables
```
DATABASE_URL=your-neon-connection-string
PORT=3000
```