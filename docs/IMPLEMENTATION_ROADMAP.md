# FINAL Implementation Roadmap — Keramik Store Platform

Stack keputusan final:
- **PostgreSQL** (transactional DB)
- **Prisma ORM**
- **Redis** (caching + queue backend)
- **Qdrant self-hosted** (vector DB)
- **Ollama (local)** untuk **LLM** dan **embedding model**
- **Midtrans Snap + Webhook** untuk pembayaran

Dokumen ini memecah implementasi menjadi fase yang bisa dieksekusi dan diverifikasi. Setiap fase punya **Deliverables** dan **Definition of Done (DoD)**.

> Catatan: roadmap ini mengasumsikan repo backend ada di `rag-keramik-nestjs/`.

---

## 0) Prasyarat & Baseline Infrastruktur (1–2 hari)
### Output
- Baseline environment dev (local) dan struktur config untuk stack final:
  - Database: **PostgreSQL**
  - ORM: **Prisma**
  - Cache: **Redis**
  - Vector DB: **Qdrant self-hosted**
  - LLM + Embedding: **Ollama (local)**
  - Payments: **Midtrans Snap + Webhook**
  - Background jobs: **BullMQ + Redis**

### DoD (Definition of Done)
- File `.env.example` disepakati dan tervalidasi (minimal variabel):
  - `DATABASE_URL`
  - `REDIS_URL`
  - `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`
  - `OLLAMA_BASE_URL`
  - `OLLAMA_LLM_MODEL` (mis. `llama3.2:3b` / model pilihan Anda)
  - `OLLAMA_EMBED_MODEL` (mis. `nomic-embed-text`)
  - `QDRANT_URL`
  - `QDRANT_COLLECTION` (mis. `keramik_documents`)
  - `STORAGE_PROVIDER` (mis. `local` | `s3`), dan jika `s3`: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- Dev stack bisa dinyalakan lokal (via docker compose atau services lokal) dengan:
  - Postgres up
  - Redis up
  - Qdrant up
  - Ollama up (atau terinstal di host)

### Alternatif (tetap dicatat, tapi bukan pilihan utama)
- **pgvector** jika ingin mengurangi komponen infra (trade-off: fitur vector & filtering/ops berbeda dari Qdrant).
- Tanpa queue hanya untuk prototyping (tidak direkomendasikan untuk ingestion dokumen).

---

## 1) Foundation: Project Structure & Quality Gates (1–2 hari)
### Task
- Tetapkan struktur modul `src/modules/*` (tanpa over-modular).
- Tambah standar:
  - global exception filter (format error konsisten)
  - request validation (sudah ada) + DTO per endpoint
  - Swagger grouping + auth header (sudah ada bearer)
  - health endpoint `/v1/health`
  - config validation diperluas (DB/Redis/Qdrant/Ollama/Midtrans)

### Deliverables
- Skeleton modules (kosong tapi wired): Auth, Users, Products, Orders, Payments, Documents, Chat.

### DoD
- `npm run start:dev` jalan.
- Swagger menampilkan route dasar.

---

## 2) Database & ORM Setup (PostgreSQL) (1–2 hari)
### Task
- Install Prisma dan setup Prisma Client.
- Define schema awal:
  - `users`
  - `products`
  - `orders`, `order_items`
  - `payments`
  - `documents`, `chat_sessions`, `chat_messages` (bisa placeholder dulu)
- Buat migration pertama.
 - Tambah seed minimal (admin user + sample product) untuk dev.

### Deliverables
- Database schema versi 0.

### DoD
- Migration apply clean di env dev.
- Basic repository/service bisa CRUD `products`.

### Catatan desain data (recommended)
- Gunakan `JSONB` untuk `products.attributes` agar fleksibel (ukuran, grade, indoor/outdoor, anti-slip, dsb), sambil tetap menjaga transaksi order/payment di tabel relasional.

### Alternatif (dicatat)
- MongoDB bisa dipakai untuk domain yang sangat document-heavy, tapi untuk scope e‑commerce + payment, Postgres tetap lebih aman dan rapi.

---

## 3) Auth & RBAC (2–4 hari)
### Scope
Minimal untuk admin panel + API security.

### Task
- JWT login (email/password) + bcrypt.
- Roles: `ADMIN`, `STAFF`, `CUSTOMER`.
- Guards + decorators untuk RBAC.

### Deliverables
- Auth endpoints + middleware/guards.

### DoD
- Endpoint admin hanya bisa diakses role admin.
- Token expiry & error handling jelas.

---

## 4) Products & Catalog (2–5 hari)
### Task
- Produk:
  - fields: name, sku, price, description, attributes (JSONB), status
- Listing dengan pagination.
- Admin CRUD.
 - Caching read-heavy:
   - cache `GET /products` (list) di Redis dengan TTL (mis. 30–120 detik)
   - invalidation saat admin create/update/delete

### Deliverables
- `GET /v1/products` dan CRUD admin.

### DoD
- Validasi DTO lengkap.
- Query cepat untuk listing.

---

## 5) Cart & Order Lifecycle (3–7 hari)
### Task
- Cart (opsional bila ingin langsung order):
  - add/remove items
  - compute totals
- Orders:
  - create order dari cart
  - status: `DRAFT` (optional) → `PENDING_PAYMENT` → `PAID` → `FULFILLMENT` → `COMPLETED` / `CANCELLED`

### Deliverables
- Order creation endpoint.

### DoD
- Order totals benar, order items immutable setelah paid.

---

## 6) Midtrans Payments (Snap + Webhook) (3–6 hari)
### Task
- Endpoint create snap transaction:
  - generate `midtrans_order_id` unik
  - simpan `payments` record
  - return `snap_token`/redirect URL
- Webhook handler:
  - verifikasi signature
  - idempotent update
  - mapping status Midtrans → Payment/Order status
- Simpan raw webhook payload untuk audit.

### Deliverables
- `POST /v1/payments/midtrans/snap`
- `POST /v1/payments/midtrans/webhook`

### DoD
- Test scenario:
  - pending → settlement
  - expire/cancel
  - webhook retry tidak menyebabkan double-update
  - signature verification wajib lulus untuk semua webhook

### Alternatif
- Jika butuh kontrol penuh: Midtrans Core API (lebih kompleks).

---

## 7) Document Upload & Storage (2–5 hari)
### Task
- Storage abstraction: local vs S3.
- Document model: filename, mime, size, storage key, status.
- Upload endpoint (admin).

### Deliverables
- `POST /v1/documents` upload.

### DoD
- File tersimpan dan metadata masuk DB.

---

## 8) Ingestion Pipeline (Parse → Chunk → Embed → Index) (4–10 hari)
### Task
- Parsing:
  - PDF: `pdf-parse` (atau alternatif)
  - DOCX: `mammoth`
  - TXT: direct
- Chunking strategy:
  - token/char-based + overlap
- Queue worker (BullMQ):
  - job `document.ingest`
- Vector provider implementation:
  - Qdrant: create collection, upsert points, payload metadata
 - Embedding provider (Ollama):
  - generate embedding via Ollama embedding model
  - simpan `vector_id`/metadata mapping ke DB (untuk delete/reindex)

### Deliverables
- `POST /v1/documents/:id/ingest` enqueue.
- Worker ingestion.

### DoD
- Status dokumen: `UPLOADED` → `PROCESSING` → `INDEXED` atau `FAILED`.
- Bisa retrieve top‑K chunks untuk query.
 - Re-index aman (delete old vectors by `documentId` lalu upsert ulang).

---

## 9) Chat RAG API (3–7 hari)
### Task
- `POST /v1/chat/ask`:
  - embed question
  - vector search
  - prompt compose
  - LLM call (Ollama local)
  - store message + audit
- Session optional (kalau ingin chat history).

### Deliverables
- Chat endpoint + minimal persistence.

### DoD
- Jawaban menyertakan “I don’t know” fallback saat context tidak cukup.
- Rate limit untuk mencegah abuse.
 - Timeout & circuit breaker sederhana untuk call ke Ollama (agar API tidak hang).

---

## 10) Hardening: Observability, Security, Performance (2–6 hari)
### Task
- Request logging structured.
- Rate limiting.
- Audit events (payment changes, admin actions).
- Config validation (sebagian sudah ada) diperluas untuk Midtrans/DB/vector/LLM.
 - Redis caching policy terdokumentasi (TTL, key naming, invalidation strategy).

### DoD
- Health readiness mencakup DB + redis (jika ada) + vector.

---

## 11) Testing Strategy (berjalan paralel, minimal wajib)
### Minimum
- Unit tests untuk:
  - payment status mapping
  - webhook signature verification
  - chunking
- E2E tests untuk:
  - create order → create snap token
  - webhook update order

### DoD
- `npm run test` dan `npm run test:e2e` stabil.
 - E2E mencakup dependency real/stub:
  - Midtrans webhook: gunakan fixture payload + signature
  - Qdrant/Ollama: bisa menggunakan container test atau mock adapter (pilih salah satu dan konsisten)

---

## 12) Deployment (1–3 hari)
### Task
- Docker compose untuk dev: API + Postgres + Redis + Qdrant + Ollama (+ MinIO opsional).
- Production notes:
  - gunakan managed DB/Redis bila memungkinkan
  - secret management

### DoD
- Satu perintah untuk local stack (compose).

---

## Timeline Kasar (opsi)
- MVP commerce + Midtrans: ~2–3 minggu part-time
- MVP RAG ingestion + chat: +1–2 minggu
- Hardening & testing: +1 minggu

Jika Anda mau, saya bisa turunkan roadmap ini menjadi checklist per file/module (NestJS) sesuai struktur repo yang sekarang.
