# ⚽ Football Management Team

A backend API project for managing football teams, built with Node.js, Express, Prisma, Passport JWT authentication, and TypeScript.

## 🚀 Features

- User authentication & role-based authorization
- Team management APIs
- PostgreSQL + Prisma ORM
- JWT access/refresh tokens
- Swagger API documentation
- Linting, formatting, and testing support

## 📦 Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- Passport JWT
- Jest for testing
- ESLint + Prettier
- PM2 for production

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/haniolwan/football-management-team.git
cd football-management-team
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Environment Setup

- Create a .env file in the root with the following environment variables:

```bash
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<your-db>
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
```

### 4. Run Tests

- Create a .env file in the root with the following environment variables:

```bash
yarn test
```

### 4. Prisma DB push (apply schema to DB)

- Create a .env file in the root with the following environment variables:

```bash
yarn db:push
```

### 📚 API Documentation

- After running the app, access Swagger UI at:

```bash
http://localhost:5000/v1/docs
```
