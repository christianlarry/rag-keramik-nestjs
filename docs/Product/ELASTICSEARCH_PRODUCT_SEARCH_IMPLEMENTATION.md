# Elasticsearch Product Search — Implementation Guide (Industry Standard)

Dokumen ini menjadi **langkah implementasi awal** untuk Elasticsearch pada product search, mengikuti arsitektur di `SYSTEM_DESIGN.md` (modular monolith NestJS + PostgreSQL sebagai source of truth).

## 1) Keputusan Teknologi (penting dulu)

## Apakah sudah ada NestJS Elasticsearch?
- **Ya**, package resmi NestJS: `@nestjs/elasticsearch`.
- Di project ini, dependency yang **sudah terpasang** adalah `@elastic/elasticsearch` (official JS client).

## Rekomendasi untuk project ini
- **Mulai dengan `@elastic/elasticsearch`** dulu (tanpa `@nestjs/elasticsearch`).
- Alasan:
  1. Sudah ada di dependency saat ini.
  2. Lebih fleksibel untuk control retry, bulk, index management, dan low-level API.
  3. Cocok untuk pattern infra module/service yang sudah dipakai (mirip `RedisModule`).

> Jika nanti ingin konsistensi gaya Nest wrapper, baru evaluasi migrasi ke `@nestjs/elasticsearch`.

---

## 2) Prinsip Arsitektur

- **PostgreSQL tetap source of truth** untuk data produk.
- Elasticsearch hanya untuk:
  - full-text search,
  - filtering cepat,
  - sorting relevancy + business score.
- Jangan menulis langsung data bisnis ke Elasticsearch tanpa persist ke PostgreSQL.
- Sinkronisasi ke Elasticsearch dilakukan via event/asynchronous job (idealnya BullMQ).

---

## 3) Tahapan Implementasi (urut eksekusi)

## Step 0 — Define Scope Search V1 (minimal tapi proper)
Tetapkan dulu use-case V1:
- search by keyword (`name`, `description`, `sku`)
- filter: `price range`, `availability`, `surfaceType`, `indoorOutdoor`, `category`
- sort: relevance, newest, price asc/desc

Output step ini:
- `search request contract`
- `search response contract` (include pagination dan total hits)

## Step 1 — Setup Elasticsearch Server di Docker
Tambahkan service Elasticsearch pada `docker-compose.yml`.

Contoh baseline development (single-node):

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.15.0
  container_name: keramik-elasticsearch
  restart: unless-stopped
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
    - ES_JAVA_OPTS=-Xms1g -Xmx1g
  ports:
    - "9200:9200"
    - "9300:9300"
  volumes:
    - keramik_elasticsearch_data:/usr/share/elasticsearch/data
  healthcheck:
    test: ["CMD-SHELL", "curl -fsS http://localhost:9200/_cluster/health || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 30
```

Tambahkan volume:

```yaml
volumes:
  keramik_elasticsearch_data:
```

Catatan industri:
- Pin versi image (jangan `latest`).
- Untuk production, **aktifkan auth/TLS** (jangan disable security).

## Step 2 — Tambah Konfigurasi App
Tambahkan env var (contoh):

```env
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_INDEX_PRODUCTS=products_v1
ELASTICSEARCH_REQUEST_TIMEOUT_MS=30000
ELASTICSEARCH_MAX_RETRIES=3
```

Lalu buat config module seperti pattern existing (`redis.config.ts`):
- `src/modules/search/infrastructure/config/elasticsearch-config.type.ts`
- `src/modules/search/infrastructure/config/elasticsearch.config.ts`
- register ke `ConfigModule.forRoot({ load: [...] })`
- update `AllConfigType` di `src/config/config.type.ts`

## Step 3 — Bangun Infrastructure Module/Service ES (yang Anda rencanakan)
Rekomendasi struktur:

```text
src/modules/search/
  search.module.ts
  infrastructure/
    config/
      elasticsearch.config.ts
      elasticsearch-config.type.ts
    elasticsearch/
      elasticsearch.module.ts
      elasticsearch.client.ts
      elasticsearch-index.manager.ts
```

Tanggung jawab:
- `elasticsearch.module.ts`
  - provider singleton ES client
  - graceful shutdown (`onModuleDestroy`)
- `elasticsearch.client.ts`
  - wrapper method low-level (`search`, `bulk`, `index`, `delete`)
- `elasticsearch-index.manager.ts`
  - create index, alias, mapping/settings bootstrap

## Step 4 — Desain Index Mapping Product (wajib sebelum coding query)
Gunakan index versioning dari awal:
- physical index: `products_v1_yyyyMMdd`
- read alias: `products_read`
- write alias: `products_write`

Field guideline:
- `id`: `keyword`
- `sku`: `keyword`
- `name`: `text` + `keyword` subfield
- `description`: `text`
- `category`: `keyword`
- `price`: `scaled_float` atau `integer` (dalam cents)
- `isAvailable`: `boolean`
- `attributes.*`: kombinasi `keyword`/`flattened` sesuai kebutuhan
- `createdAt`, `updatedAt`: `date`

Analyzer:
- Mulai dari `standard` dulu.
- Jika butuh bahasa Indonesia lebih akurat, evaluasi custom analyzer secara bertahap (jangan over-design di V1).

## Step 5 — Implement Product Search Query Service
Buat service query di module product/search application layer:
- input DTO: keyword, filters, pagination, sort
- query builder ke Elasticsearch (`bool` query: `must`, `filter`, `should`)
- output normalisasi response (hits + metadata)

Best practice:
- Hard limit `size` (misal max 100)
- Default timeout query
- Jangan expose raw ES query langsung ke controller

## Step 6 — Data Sync PostgreSQL -> Elasticsearch
Gunakan salah satu pola (disarankan urutan adopsi):

1. **Synchronous after-commit (quick start)**
   - setelah create/update product, kirim index/update document.
   - cocok untuk awal, tapi risk request latency naik.

2. **Outbox + Worker (recommended industry)**
   - simpan event product changed di outbox table.
   - worker (BullMQ) consume event -> bulk index ke ES.
   - lebih resilient, idempotent, mudah retry.

Karena sistem Anda sudah punya arah queue/event, targetkan pola #2 secepatnya.

## Step 7 — Reindex & Zero-Downtime Strategy
Siapkan command/job reindex:
1. create new physical index (`products_v2_xxx`)
2. backfill data from PostgreSQL (batch)
3. validate doc count + sample query
4. switch alias `products_read`/`products_write`
5. monitor

Ini mencegah downtime saat ubah mapping besar.

## Step 8 — Observability & Reliability
Minimal yang wajib:
- log structured untuk operasi ES (`index`, `bulk`, `search`)
- metric: latency, error rate, bulk failure count
- health indicator untuk konektivitas ES
- retry policy dengan backoff
- circuit breaker/fallback: jika ES down, API tetap return graceful error (bukan crash)

## Step 9 — Security & Governance
Development:
- boleh `xpack.security.enabled=false`

Staging/Production:
- wajib auth + TLS
- secrets via env/secret manager
- network restriction (private subnet / firewall)
- audit access logs

---

## 4) Definition of Done (DoD) — Fase Infra ES

Fase “infrastructure module/service dulu” dianggap selesai jika:

- [ ] Elasticsearch service berjalan di Docker dan healthy
- [ ] Config ES tervalidasi via `class-validator`
- [ ] ES client provider singleton tersedia di NestJS
- [ ] Index bootstrap (create index + mapping + alias) bisa dijalankan
- [ ] Health check endpoint menunjukkan status ES
- [ ] Logging & retry policy dasar aktif
- [ ] Dokumentasi env + local runbook update

---

## 5) Urutan Implementasi Praktis (minggu pertama)

1. Setup Docker ES + env config
2. Build `ElasticsearchModule` (infra only)
3. Add index manager (mapping + alias bootstrap)
4. Add health check + smoke script
5. Baru lanjut ke product search query + sync pipeline

---

## 6) Catatan untuk Project Ini

Berdasarkan kondisi repo saat ini:
- Anda **sudah siap mulai** karena `@elastic/elasticsearch` sudah ada.
- Langkah terbaik: implement **infra module/service ES dulu** (keputusan Anda sudah tepat), lalu lanjut query service + sinkronisasi data.
- Hindari langsung menulis endpoint search sebelum mapping, alias strategy, dan sync flow jelas.
