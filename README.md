# E-Commerce Reviews API

Production-style NestJS Product Reviews & Ratings API built with:

- NestJS
- PostgreSQL
- TypeORM
- JWT Authentication
- Swagger
- Docker
- Jest Testing

---

# Features

## Authentication
- JWT login
- Customer authentication
- Admin authorization

## Reviews
- Create review for purchased products only
- Prevent duplicate reviews
- Update own review
- Paginated product reviews

## Rating Analytics
- Average rating
- Rating distribution
- Total reviews count

## Admin Moderation
- Hide inappropriate reviews

## Validation & Business Rules
- Product must exist
- Order must exist
- Order must belong to authenticated user
- Order must be delivered
- Product must exist inside the order
- One review per product per order

---

# Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Docker Compose
- Swagger
- Jest

---

# Project Setup

## 1. Clone repository

```bash
git clone https://github.com/omarshhh/ecommerce-reviews-api.git
cd ecommerce-reviews-api
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create environment file

### Windows

```bash
copy .env.example .env
```

### macOS/Linux

```bash
cp .env.example .env
```

---

## 4. Start Docker containers

```bash
npm run docker:up
```

This starts:

- PostgreSQL
- pgAdmin

---

## 5. Seed database

```bash
npm run seed
```

This inserts:

- Users
- Products
- Orders
- Order items

---

## 6. Start application

```bash
npm run start:dev
```

---

# Swagger Documentation

```txt
http://localhost:3000/api
```

---

# pgAdmin

```txt
http://localhost:5050
```

## Login

```txt
Email: admin@admin.com
Password: admin
```

## PostgreSQL Connection

```txt
Host: postgres
Port: 5432
Username: postgres
Password: postgres
Database: ecommerce_reviews
```

---

# Seeded Users

## Customer

```txt
email: omar@test.com
password: 123456
```

## Admin

```txt
email: admin@test.com
password: 123456
```

---

# Available Scripts

## Development

```bash
npm run start:dev
```

## Run Tests

```bash
npm run test
```

## Docker Up

```bash
npm run docker:up
```

## Docker Down

```bash
npm run docker:down
```

## Reset Docker Volumes

```bash
npm run docker:reset
```

## Seed Database

```bash
npm run seed
```

---

# API Endpoints

## Auth

```http
POST /auth/login
```

---

## Reviews

```http
POST /reviews
PATCH /reviews/:reviewId
GET /products/:productId/reviews
```

---

## Analytics

```http
GET /products/:productId/rating-summary
GET /products/:productId/rating-distribution
```

---

## Admin

```http
PATCH /admin/reviews/:reviewId/hide
```

---

# Postman Testing Flow

1. Seed database
2. Login customer
3. Login admin
4. Create review
5. Update review
6. Get product reviews
7. Get rating summary
8. Hide review
9. Verify hidden review
10. Verify updated analytics

---

# Testing

Implemented Jest unit tests for:

- Review creation
- Validation rules
- Authorization
- Duplicate prevention
- Review hiding

---

# Postman Collection

The exported Postman collection is available in:

```txt
/postman/E-Commerce Reviews API.postman_collection.json
```

Import it into Postman and run the API testing flow.

---

# Author

Omar Shammout