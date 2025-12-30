<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Keramik Store API (NestJS)

Backend REST API untuk **platform toko keramik** yang mencakup:
- **E‑commerce core** (products, orders)
- **Payment gateway Midtrans** (Snap + webhook)
- **RAG-powered Product Knowledge Assistant** (dokumen katalog/FAQ/aturan pemasangan)

Dokumen desain & roadmap ada di:
- `../docs/SYSTEM_DESIGN.md`
- `../docs/IMPLEMENTATION_ROADMAP.md`

## Tech Stack (final)
- Runtime: Node.js (LTS) + TypeScript
- Framework: NestJS
- Database transaksi: PostgreSQL
- ORM: Prisma
- Cache: Redis
- Vector DB: Qdrant (self-hosted)
- LLM & Embedding: Ollama (local)
- Payment gateway: Midtrans (Snap + webhook)
- API docs: Swagger (`/docs`)

## Prerequisites
Service yang perlu tersedia saat development:
- PostgreSQL
- Redis
- Qdrant
- Ollama (jalan di host atau container)

Port default yang umum:
- Postgres: `5432`
- Redis: `6379`
- Qdrant: `6333`
- Ollama: `11434`

## Getting Started
### 0) Start dependencies (Docker Compose)
Di folder `rag-keramik-nestjs/`:
```bash
npm run dev:services
```

Services yang akan menyala:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Qdrant: `http://localhost:6333`
- Ollama: `http://localhost:11434`

### 1) Install dependencies
```bash
npm install
```

### 2) Siapkan environment variables
Gunakan `.env` di root folder ini (`rag-keramik-nestjs/`).

Mulai cepat:
```bash
cp .env.example .env
```

Minimal app config (sudah dipakai oleh app sekarang):
- `NODE_ENV` (default: `development`)
- `APP_PORT` (default: `3000`)
- `API_PREFIX` (default: `api`)

Service config (dibutuhkan sesuai roadmap/fitur):
- `DATABASE_URL`
- `REDIS_URL`
- `QDRANT_URL`
- `QDRANT_COLLECTION`
- `OLLAMA_BASE_URL`
- `OLLAMA_LLM_MODEL`
- `OLLAMA_EMBED_MODEL`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`

### 3) Jalankan API
```bash
npm run start:dev
```

### 4) Swagger
Swagger UI tersedia di:
- `http://localhost:<APP_PORT>/docs`

Semua endpoint API mengikuti:
- `/<API_PREFIX>/v1/...` (URI versioning)

## Key Endpoints (target desain)
> Daftar ini mengikuti desain sistem; implementasi endpoint dilakukan bertahap sesuai roadmap.

### Payments (Midtrans)
- `POST /<API_PREFIX>/v1/payments/midtrans/snap`
- `POST /<API_PREFIX>/v1/payments/midtrans/webhook`

### Documents & RAG
- `POST /<API_PREFIX>/v1/documents` (upload)
- `POST /<API_PREFIX>/v1/documents/:id/ingest` (enqueue)
- `POST /<API_PREFIX>/v1/chat/ask`

### Products / Orders
- `GET /<API_PREFIX>/v1/products`
- `POST /<API_PREFIX>/v1/orders`

## Local Models (Ollama)
Contoh (sesuaikan dengan model pilihan Anda):
```bash
ollama pull nomic-embed-text
ollama pull llama3.2
```

Lalu set di `.env`:
- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_EMBED_MODEL=nomic-embed-text`
- `OLLAMA_LLM_MODEL=llama3.2`

## Testing
```bash
npm run test
npm run test:e2e
```

## Notes
- Endpoint webhook Midtrans harus **idempotent** dan memverifikasi signature.
- RAG pipeline sebaiknya berjalan via job queue (BullMQ) agar tidak mengunci request.
- Produk menggunakan `attributes` (JSONB) agar fleksibel untuk variasi spesifikasi keramik.
