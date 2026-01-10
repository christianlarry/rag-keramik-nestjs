# System Design — Keramik Store Platform (E‑commerce + RAG + Midtrans)

## 1. Ringkasan
Sistem ini adalah **backend REST API berbasis NestJS** untuk toko keramik yang mencakup:
- **E‑commerce core**: katalog produk, stok, cart, order, pembayaran, status pengiriman.
- **RAG (Retrieval-Augmented Generation)**: asisten pengetahuan produk berbasis dokumen katalog/FAQ/aturan pemasangan.
- **Pembayaran Midtrans**: pembayaran order via Snap / Core API, plus webhook untuk sinkronisasi status transaksi.

Target: desain modular “enterprise-feel”, mudah di-scale, dan mudah diuji.

## 2. Problem Statement & Goals
### 2.1 Masalah
- Produk keramik banyak atribut (ukuran, motif, grade, anti-slip, indoor/outdoor, dsb).
- Dokumen pendukung (katalog/FAQ/aturan pemasangan) tersebar; CS/admin capek menjawab repetitif.
- E‑commerce butuh transaksi “proper”: audit, konsistensi pembayaran, idempotency, dan data relational.

### 2.2 Goals
- API untuk **manajemen produk + transaksi** yang jelas, aman, dan terukur.
- RAG pipeline yang bisa ingest dokumen, index ke vector DB, dan melayani Q&A.
- Integrasi Midtrans yang benar (webhook + status order).

### 2.3 Non‑Goals (agar scope terkendali)
- UI frontend (Next.js) tidak dibangun di repo ini.
- Sistem logistik / integrasi kurir otomatis bisa ditunda (opsional di fase lanjut).

## 3. Stakeholders & Use Cases
### 3.1 Aktor
- **Customer**: browsing, add to cart, checkout, bayar, tanya produk.
- **Admin**: kelola produk, dokumen, memantau order & pembayaran.
- **System**: Midtrans webhook, background job (ingestion, embedding).

### 3.2 Use Cases Utama
- Admin upload katalog/FAQ → diparse → di-chunk → embedding → index ke vector DB.
- Customer chat → search top‑K context → jawab via LLM.
- Customer checkout → create order → create Midtrans payment → update order via webhook.

## 4. Proposed Tech Stack (Recommended)
### 4.1 Runtime & Framework
- **Node.js (LTS)** + **NestJS 11 (TypeScript)**
- **OpenAPI/Swagger** via `@nestjs/swagger` (sudah ada)

### 4.2 Database (Transaksional)
**Primary recommendation: PostgreSQL**
- Cocok untuk transaksi/order, relasi, konsistensi, dan reporting.

ORM recommendation:
- **Prisma** (recommended): migrasi cepat, DX bagus, schema-driven.

Alternatif (kalau Anda lebih nyaman):
- **TypeORM**: integrated dengan NestJS, pattern lebih klasik.
- **Drizzle**: ringan & type-safe, bagus untuk performa.

### 4.3 Cache / Queue / Background Jobs
- **Redis** untuk cache, rate limit, dan job queue.
- Job queue: **BullMQ** (NestJS friendly) untuk ingestion & embedding.

Alternatif minimal (kalau mau simpel dulu):
- Tanpa queue, proses ingestion synchronous (risiko timeouts & UX buruk).

### 4.4 Vector Database
Recommendation (paling “production-ready”):
- **Qdrant** (self-hosted / cloud) — performa bagus, filtering metadata oke.

Alternatif:
- **pgvector** (Postgres extension) jika ingin stack lebih sederhana (1 database). Cocok untuk skala kecil–menengah.
- **Pinecone** (managed) jika mau minim ops.

### 4.5 LLM & Embedding
- LLM (cloud): **OpenAI** (mis. `gpt-4o-mini`, atau model yang sesuai budget)
- LLM (local): **Ollama** + model Mistral/Llama
- Embedding:
  - Cloud: OpenAI `text-embedding-3-small/large`
  - Local: `nomic-embed-text` via Ollama

### 4.6 Document Storage
- Development: local filesystem (volume-mounted)
- Production: S3-compatible (**AWS S3 / MinIO**) + signed URL

### 4.7 Auth & Security
- **JWT** untuk API auth (admin) (deps sudah ada)
- Opsional: **Google OAuth2** (deps sudah ada) untuk login admin
- **RBAC** (Admin, Staff, Customer)
- **Helmet**, **CORS**, validation pipe (sudah ada)

### 4.8 Observability
- Logging: pino (recommended) atau morgan (sudah ada)
- Metrics: Prometheus (opsional)
- Tracing: OpenTelemetry (opsional)

## 5. High-Level Architecture
### 5.1 Logical Architecture
```
[Client Web/Mobile]
        |
        v
[NestJS API (Monolith Modular)]
  |        |          |
  v        v          v
PostgreSQL  Redis     Object Storage
  |                    |
  v                    v
Vector DB (Qdrant/pgvector)    
  |
  v
LLM Provider (OpenAI/Ollama)

Midtrans <--- Webhook ---> NestJS
```

### 5.2 Deployment Topology (pragmatic)
- API: 1 service/container
- Postgres: managed (Supabase/RDS) atau container
- Redis: managed atau container
- Qdrant: container/managed

## 6. Domain Model (Core)
### 6.1 Entities (minimum viable, namun “proper”)
- **User**: customer/admin, auth identities
- **Product**: SKU, nama, deskripsi, harga, atribut (ukuran, permukaan, indoor/outdoor, dll)
- **Inventory**: stok per SKU (atau per gudang jika advanced)
- **Cart** + **CartItem**
- **Order** + **OrderItem**
- **Payment**: representasi transaksi Midtrans
- **Document**: file katalog/FAQ, status ingest
- **DocumentChunk** (optional): metadata chunk, pointer ke vector id
- **ChatSession** + **ChatMessage**
- **AuditLog**: event penting (login, upload, payment status changes)

### 6.2 PostgreSQL vs MongoDB (kritik & alternatif)
- **PostgreSQL** lebih cocok untuk order/payment karena:
  - Transaksi & constraints (FK, unique, checks)
  - Reporting (sales per product, conversion, dsb)
  - Integritas data status pembayaran
- **MongoDB** masih oke jika:
  - Anda butuh fleksibilitas atribut produk yang sangat variatif
  - Transaksi tidak kompleks (atau Anda sudah matang dengan saga/idempotency di app layer)

Kompromi terbaik (kalau atribut produk sangat dinamis):
- Tetap Postgres untuk transaksi, dan gunakan kolom **JSONB** untuk atribut produk.

## 7. Modules (NestJS) — Proposed Boundaries
> Catatan: modul di bawah memprioritaskan separation of concerns, bukan jumlah modul sebanyak-banyaknya.

### 7.1 Core Commerce
- **AuthModule**: login admin/customer, JWT, refresh token (optional)
- **UsersModule**: profile, roles
- **ProductsModule**: CRUD produk, kategori, media
- **InventoryModule**: stok, reserved stock saat checkout (optional)
- **CartModule**: cart lifecycle
- **OrdersModule**: create order, status order
- **PaymentsModule**: Midtrans integration + webhook
- **MailModule**: Mailer

### 7.2 RAG / Knowledge Assistant
- **DocumentsModule**: upload, parsing, chunking, ingestion status
- **EmbeddingModule**: generate embeddings
- **VectorModule**: upsert/search vectors
- **ChatModule**: `/chat/ask`, session, message history
- **PromptModule**: prompt templates + guardrails
- **AuditModule**: audit Q&A dan event kritikal

### 7.3 Shared / Platform
- **ConfigModule** (sudah ada)
- **HealthModule**: readiness/liveness
- **StorageModule**: S3/local abstraction

## 8. RAG Design (Detailed)
### 8.1 Ingestion Pipeline
1) Upload document (PDF/DOCX/TXT)
2) Extract text
3) Normalize (hapus header/footer noise jika perlu)
4) Chunking (mis. 500–800 tokens, overlap 50–100)
5) Embedding per chunk
6) Upsert ke Vector DB dengan metadata:
   - `documentId`, `sourceType`, `productSku?`, `page`, `section`, `language`, `createdAt`

### 8.2 Query Pipeline
1) User question → embedding
2) Vector search top‑K (mis. 5)
3) (Optional) re-rank (jika memakai model reranker)
4) Compose prompt:
   - system prompt “bahasa toko keramik”, style guide, batasan
   - context snippets + citation metadata
5) Call LLM → response
6) Log ke Audit/ChatMessage

### 8.3 Guardrails (minimal tapi penting)
- Jangan halu: jawab hanya berdasarkan context, atau bilang “data tidak tersedia”
- Redact data sensitif (token, email) dari context

## 9. Payment Design — Midtrans
### 9.1 Pilihan Integrasi
Recommended untuk cepat & robust:
- **Midtrans Snap** (redirect/hosted payment page) + **Webhook**

Alternatif jika ingin kontrol penuh:
- **Core API** (lebih kompleks; Anda handle payment UI/flow lebih banyak)

### 9.2 Flow Checkout (Snap)
1) Customer checkout → create `Order` (status `PENDING_PAYMENT`)
2) Create `Payment` record (status `INITIATED`)
3) Call Midtrans to create transaction, pass:
   - `order_id` (harus unik, idempotent)
   - `gross_amount`
   - item details
   - customer details
4) Return `snap_token` / redirect URL ke client
5) Midtrans mengirim **webhook** (transaction status)
6) Backend memverifikasi signature, update:
   - Payment status: `SETTLEMENT`, `PENDING`, `CANCEL`, `EXPIRE`, `DENY`, `REFUND`...
   - Order status: `PAID` jika settlement/paid

### 9.3 Idempotency & Consistency
- Endpoint webhook harus **idempotent** (event sama datang berkali-kali).
- Simpan raw payload webhook untuk audit.
- Pastikan mapping `order_id` ↔ `payment.midtransOrderId` unik.

### 9.4 Minimal Tables/Fields (Payment)
- `payments.id`
- `payments.orderId` (FK)
- `payments.provider = 'MIDTRANS'`
- `payments.providerRef` (midtrans order_id)
- `payments.status`
- `payments.amount`
- `payments.rawWebhookPayload` (json)

## 10. API Surface (Draft)
> Semua endpoint berada di bawah prefix yang sudah ada (`/api`) dan versioning URI.

### 10.1 Auth
- `POST /v1/auth/login`
- `POST /v1/auth/refresh` (optional)

### 10.2 Products
- `GET /v1/products`
- `POST /v1/products` (admin)
- `GET /v1/products/:id`
- `PATCH /v1/products/:id` (admin)

### 10.3 Cart & Orders
- `POST /v1/cart/items`
- `GET /v1/cart`
- `POST /v1/orders` (checkout)
- `GET /v1/orders/:id`

### 10.4 Payments (Midtrans)
- `POST /v1/payments/midtrans/snap` (create snap token)
- `POST /v1/payments/midtrans/webhook` (callback)

### 10.5 Documents & Chat
- `POST /v1/documents` (upload)
- `POST /v1/documents/:id/ingest` (enqueue ingest)
- `POST /v1/chat/ask`

### 10.6 Admin/Audit
- `GET /v1/audit/events`

## 11. Data Retention & Compliance (Pragmatic)
- Simpan dokumen asli di object storage (S3) dengan akses terbatas.
- Log chat untuk improvement, tapi berikan opsi anonimisasi.
- Token API keys (OpenAI/Midtrans) hanya di env/secret manager.

## 12. Risks & Mitigations
- **RAG halusinasi** → strict prompting + “no answer” fallback.
- **Webhook replay** → signature verification + idempotency.
- **Ingestion berat** → BullMQ + worker concurrency.
- **Biaya LLM** → caching, limit tokens, pilih model hemat.

## 13. Milestones (High-level)
- M1: Core commerce + Postgres schema + auth
- M2: Midtrans payment + webhook + order lifecycle
- M3: Document ingestion + vector DB + chat RAG
- M4: Observability + hardening + deployment
