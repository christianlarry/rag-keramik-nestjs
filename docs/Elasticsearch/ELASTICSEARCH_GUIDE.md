# Panduan Elasticsearch — Dari Nol Sampai Paham

> Dokumen ini adalah panduan menyeluruh tentang Elasticsearch, ditulis untuk pembaca yang belum pernah
> menggunakannya sebelumnya. Setiap konsep dijelaskan dari fondasinya, dilanjutkan dengan cara
> pemakaian nyata di codebase ini (NestJS dengan `@elastic/elasticsearch` v9).

---

## Daftar Isi

1. [Apa Itu Elasticsearch?](#1-apa-itu-elasticsearch)
2. [Konsep Inti](#2-konsep-inti)
   - 2.1 [Cluster, Node, Shard, Replica](#21-cluster-node-shard-replica)
   - 2.2 [Index & Document](#22-index--document)
   - 2.3 [Mapping & Field Types](#23-mapping--field-types)
   - 2.4 [Inverted Index — Cara ES Mencari Sangat Cepat](#24-inverted-index--cara-es-mencari-sangat-cepat)
   - 2.5 [Analyzer & Tokenizer](#25-analyzer--tokenizer)
3. [Query DSL — Bahasa Pencarian Elasticsearch](#3-query-dsl--bahasa-pencarian-elasticsearch)
   - 3.1 [Full-Text Queries](#31-full-text-queries)
   - 3.2 [Term-Level Queries](#32-term-level-queries)
   - 3.3 [Bool Query — Komposisi Logika](#33-bool-query--komposisi-logika)
   - 3.4 [Filtering vs Scoring](#34-filtering-vs-scoring)
4. [Aggregations — Analitik & Statistik](#4-aggregations--analitik--statistik)
5. [kNN Search — Pencarian Vektor](#5-knn-search--pencarian-vektor)
6. [Hybrid Search & RRF](#6-hybrid-search--rrf)
7. [Arsitektur Modul di Codebase Ini](#7-arsitektur-modul-di-codebase-ini)
8. [Panduan Penggunaan Praktis](#8-panduan-penggunaan-praktis)
   - 8.1 [Setup Environment Variables](#81-setup-environment-variables)
   - 8.2 [Membuat Index dengan Mapping](#82-membuat-index-dengan-mapping)
   - 8.3 [Mengindeks Dokumen](#83-mengindeks-dokumen)
   - 8.4 [Bulk Indexing](#84-bulk-indexing)
   - 8.5 [Mencari Dokumen](#85-mencari-dokumen)
   - 8.6 [kNN Vector Search](#86-knn-vector-search)
   - 8.7 [Hybrid Search untuk RAG](#87-hybrid-search-untuk-rag)
   - 8.8 [Update & Delete](#88-update--delete)
   - 8.9 [Health Check](#89-health-check)
9. [Best Practices](#9-best-practices)
10. [Perbandingan dengan Database Lain](#10-perbandingan-dengan-database-lain)
11. [Cheatsheet Query DSL](#11-cheatsheet-query-dsl)

---

## 1. Apa Itu Elasticsearch?

**Elasticsearch** adalah mesin pencari dan analitik terdistribusi yang dibangun di atas Apache Lucene.
Ia dirancang untuk:

- **Full-text search** berkecepatan tinggi (milidetik untuk jutaan dokumen).
- **Pencarian vektor / kNN** untuk semantic search dan RAG pipeline.
- **Analitik real-time** (log, metrik, event data).
- **Auto-complete & faceted search** pada aplikasi e-commerce.

Elasticsearch bukanlah pengganti relational database. Ia adalah lapisan pencarian yang bekerja
*berdampingan* dengan database utama (PostgreSQL/Prisma dalam codebase ini). Biasanya data
disinkronkan dari Postgres ke ES untuk keperluan pencarian.

```
┌─────────────┐   write   ┌─────────────┐
│  PostgreSQL │ ────────► │    Prisma   │
│  (sumber    │           │   (ORM)     │
│   kebenaran)│           └─────────────┘
└─────────────┘
       │
       │ sync / outbox pattern
       ▼
┌─────────────┐   search  ┌─────────────┐
│Elasticsearch│ ◄──────── │   Client    │
│  (lapisan   │           │  (NestJS)   │
│  pencarian) │           └─────────────┘
└─────────────┘
```

---

## 2. Konsep Inti

### 2.1 Cluster, Node, Shard, Replica

| Konsep      | Penjelasan                                                                                                               |
|-------------|--------------------------------------------------------------------------------------------------------------------------|
| **Cluster** | Kumpulan satu atau lebih node Elasticsearch yang bekerja bersama. Dikenali dengan nama cluster (default: `elasticsearch`). |
| **Node**    | Satu instance Elasticsearch yang berjalan (satu proses JVM). Sebuah cluster bisa punya banyak node.                     |
| **Shard**   | Potongan data sebuah index. Setiap index dibagi menjadi N shard (default: 1). Setiap shard adalah instance Lucene mandiri. |
| **Replica** | Salinan dari shard utama (primary shard). Digunakan untuk fault-tolerance dan meningkatkan throughput baca.               |

```
Index "products"
├── Primary Shard 0  ──► Replica Shard 0
└── Primary Shard 1  ──► Replica Shard 1
```

> **Aturan penting:** Jumlah shard PRIMARY tidak bisa diubah setelah index dibuat. Replika boleh diubah kapan saja.
> Untuk pengembangan lokal, `number_of_shards: 1, number_of_replicas: 0` sudah cukup.

### 2.2 Index & Document

Analoginya dengan SQL:

| Elasticsearch | SQL (PostgreSQL) |
|---------------|-----------------|
| Index         | Tabel           |
| Document      | Row/Baris       |
| Field         | Kolom           |
| Mapping       | Schema          |

**Document** adalah satu unit data dalam bentuk JSON. Setiap document memiliki:
- `_index` — nama index tempat ia disimpan.
- `_id` — identifier unik dalam index (string, auto-generate jika tidak disediakan).
- `_source` — isi dokumen asli dalam JSON.
- `_score` — nilai relevansi saat di-query (semakin tinggi = semakin relevan).

```json
{
  "_index": "products",
  "_id": "prod-001",
  "_score": 1.8547,
  "_source": {
    "title": "Keramik Lantai Motif Kayu 60x60",
    "brand": "Arwana",
    "price": 85000,
    "category": "lantai",
    "description": "Keramik berkualitas tinggi dengan motif kayu alami"
  }
}
```

### 2.3 Mapping & Field Types

**Mapping** adalah schema yang mendefinisikan tipe data setiap field dalam sebuah index.
Elasticsearch bisa menginfer mapping secara otomatis (dynamic mapping), tapi **sangat disarankan**
untuk mendefinisikan mapping secara eksplisit agar hasilnya konsisten dan optimal.

#### Tipe Field Penting

| Tipe          | Kapan digunakan                                                                        | Contoh nilai          |
|---------------|----------------------------------------------------------------------------------------|-----------------------|
| `text`        | Full-text search — dianalisis, dipecah per kata                                        | "Keramik lantai motif kayu" |
| `keyword`     | Exact match, sorting, aggregation — TIDAK dianalisis                                   | "LANTAI", "KRA-001"   |
| `integer`     | Angka bulat                                                                            | 85000, -5             |
| `float`/`double` | Angka desimal                                                                       | 3.14                  |
| `boolean`     | true / false                                                                           | true                  |
| `date`        | Tanggal atau datetime                                                                  | "2026-02-23"          |
| `object`      | JSON object yang di-flatten (field anak jadi field mandiri)                            | `{ brand: { name: "Arwana" } }` |
| `nested`      | Array of objects yang menjaga korelasi antar field dalam satu object                   | `[{ size: "60x60", stock: 100 }]` |
| `dense_vector`| Embedding vektor untuk kNN search                                                      | `[0.12, -0.87, ...]`  |
| `geo_point`   | Koordinat geografis lat/lon                                                            | `{ lat: -6.2, lon: 106.8 }` |

#### Contoh Mapping Produk

```typescript
import { IndexMapping } from 'src/core/infrastructure/persistence/elasticsearch/interfaces/index-mapping.interface';

export const PRODUCTS_MAPPING: IndexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        indonesian: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'stop'],
        },
      },
    },
  },
  mappings: {
    dynamic: 'strict', // Tolak field yang tidak terdefinisi
    properties: {
      title: {
        type: 'text',
        analyzer: 'indonesian',
        fields: {
          // Multi-field: 'title' untuk search, 'title.keyword' untuk sort/agg
          keyword: { type: 'keyword', ignore_above: 256 },
        },
      },
      description: { type: 'text', analyzer: 'indonesian' },
      brand: { type: 'keyword' },
      category: { type: 'keyword' },
      price: { type: 'integer' },
      inStock: { type: 'boolean' },
      createdAt: { type: 'date', format: 'strict_date_time' },
      // Vektor untuk semantic search (dimensi harus sesuai model embedding)
      titleVector: {
        type: 'dense_vector',
        dims: 1536,
        index: true,
        similarity: 'cosine',
      },
    },
  },
};
```

#### Object vs Nested — Perbedaan Kritis

Ini adalah salah satu jebakan terbesar pemula. Pertimbangkan array of objects:

```json
{
  "variants": [
    { "color": "putih", "stock": 100 },
    { "color": "cream", "stock": 0 }
  ]
}
```

Dengan tipe **`object`**, Elasticsearch menyimpannya sebagai:
```
variants.color = ["putih", "cream"]
variants.stock = [100, 0]
```
Query `color=putih AND stock=0` akan **match** padahal logikanya tidak (putih punya stock 100, bukan 0).

Dengan tipe **`nested`**, setiap elemen array disimpan sebagai document tersembunyi terpisah.
Korelasi terjaga. Gunakan nested jika Anda perlu query di dalam array of objects.

### 2.4 Inverted Index — Cara ES Mencari Sangat Cepat

Saat Anda mengindeks dokumen, Elasticsearch tidak menyimpan teks mentah untuk pencarian.
Ia membangun sebuah **inverted index** — seperti indeks di belakang buku.

```
Dokumen teks mentah:
  Doc 1: "Keramik lantai motif kayu"
  Doc 2: "Keramik dinding warna putih"
  Doc 3: "Lantai vinyl kayu natural"

Inverted Index yang dibangun:
  "keramik"  → [Doc 1, Doc 2]
  "lantai"   → [Doc 1, Doc 3]
  "motif"    → [Doc 1]
  "kayu"     → [Doc 1, Doc 3]
  "dinding"  → [Doc 2]
  "warna"    → [Doc 2]
  "putih"    → [Doc 2]
  "vinyl"    → [Doc 3]
  "natural"  → [Doc 3]
```

Saat user mencari "keramik kayu", Elasticsearch mencari di indeks → `keramik` ada di [Doc1, Doc2],
`kayu` ada di [Doc1, Doc3] → intersection dan scoring → Doc1 paling relevan.

Inilah mengapa pencarian ES sangat cepat: tidak ada full table scan, langsung lookup hashmap.

### 2.5 Analyzer & Tokenizer

**Analyzer** memproses teks saat pengindeksan DAN saat pencarian. Ia terdiri dari tiga tahap:

```
Teks asli: "Keramik LANTAI Motif-Kayu"
     │
     ▼
[Character Filter]  →  Bersihkan karakter khusus: "Keramik LANTAI Motif Kayu"
     │
     ▼
[Tokenizer]         →  Pecah jadi token: ["Keramik", "LANTAI", "Motif", "Kayu"]
     │
     ▼
[Token Filters]     →  lowercase: ["keramik", "lantai", "motif", "kayu"]
                        stop words (hapus kata umum): ["keramik", "lantai", "motif", "kayu"]
                        stemming (opsional): ["keramik", "lantai", "motif", "kayu"]
```

**Analyzer bawaan yang sering dipakai:**

| Analyzer    | Perilaku                                                    |
|-------------|-------------------------------------------------------------|
| `standard`  | Lowercase + tokenisasi per kata, hapus tanda baca           |
| `simple`    | Lowercase + split pada non-letter character                 |
| `whitespace`| Split hanya pada spasi, TIDAK lowercase                     |
| `keyword`   | TIDAK dianalisis sama sekali (treated as single token)      |
| `language`  | Morphological analysis per bahasa (English, French, dll.)   |

> Untuk Bahasa Indonesia, gunakan analyzer `simple` atau custom analyzer dengan stemmer/stopword Indonesia.

---

## 3. Query DSL — Bahasa Pencarian Elasticsearch

Query DSL (Domain Specific Language) adalah cara ES menerima instruksi pencarian dalam bentuk JSON.
Semua query dikirim melalui `POST /<index>/_search` dengan body JSON.

### 3.1 Full-Text Queries

Digunakan untuk field bertipe `text`. Teks query dianalisis sebelum pencarian.

#### `match` — Pencarian Kata Kunci Dasar

```typescript
// Cari produk yang mengandung 'keramik lantai' di field title
const result = await esService.search({
  index: 'products',
  query: {
    match: {
      title: {
        query: 'keramik lantai',
        // operator: 'and' → SEMUA kata harus ada (default: 'or')
        operator: 'or',
        // fuzziness: 'AUTO' → toleransi typo otomatis
        fuzziness: 'AUTO',
      },
    },
  },
});
```

**Cara kerja `or` vs `and`:**
- `or` (default): dokumen match jika mengandung SALAH SATU kata. Score lebih tinggi jika lebih banyak kata cocok.
- `and`: dokumen HANYA match jika mengandung SEMUA kata.

#### `multi_match` — Cari di Banyak Field

```typescript
const result = await esService.search({
  index: 'products',
  query: {
    multi_match: {
      query: 'keramik motif kayu',
      fields: [
        'title^3',       // Boost: title 3x lebih penting
        'description^1',
        'brand',
      ],
      type: 'best_fields', // Pakai score dari field dengan match terbaik
      fuzziness: 'AUTO',
    },
  },
});
```

**Tipe `multi_match`:**

| Type            | Perilaku                                                                             |
|-----------------|--------------------------------------------------------------------------------------|
| `best_fields`   | (Default) Score dari field terbaik. Untuk "cari satu hal di banyak field".           |
| `most_fields`   | Jumlahkan score dari semua field. Untuk dokumen yang match di banyak tempat.         |
| `cross_fields`  | Anggap semua field sebagai satu field besar. Baik untuk nama yang terbagi (first/last name). |
| `phrase`        | Semua kata harus berurutan (phrase search).                                          |

### 3.2 Term-Level Queries

Digunakan untuk field bertipe `keyword`, `integer`, `date`, `boolean`, dll.
Teks query **TIDAK** dianalisis — dicari secara exact.

```typescript
// Filter produk dengan kategori persis "lantai"
query: { term: { category: 'lantai' } }

// Filter harga antara 50,000 - 200,000
query: { range: { price: { gte: 50000, lte: 200000 } } }

// Filter dari banyak nilai (seperti SQL IN)
query: { terms: { brand: ['Arwana', 'Roman', 'Mulia'] } }

// Cek apakah field ada (tidak null)
query: { exists: { field: 'titleVector' } }

// Prefix match (untuk autocomplete pada keyword field)
query: { prefix: { 'title.keyword': 'keramik' } }

// Wildcard (lebih lambat, hindari di production hot path)
query: { wildcard: { 'title.keyword': 'keramik*' } }
```

### 3.3 Bool Query — Komposisi Logika

Bool query adalah pondasi dari query kompleks. Ia mengkombinasikan query lain dengan logika
`must`, `should`, `must_not`, dan `filter`.

```typescript
query: {
  bool: {
    // must: semua harus match, MEMPENGARUHI score
    must: [
      { match: { title: 'keramik' } },
    ],

    // filter: harus match, TIDAK mempengaruhi score (lebih cepat, di-cache)
    filter: [
      { term: { category: 'lantai' } },
      { range: { price: { lte: 200000 } } },
      { term: { inStock: true } },
    ],

    // should: lebih baik jika match, meningkatkan score (opsional)
    should: [
      { term: { brand: 'Arwana' } },
    ],
    minimum_should_match: 0, // 0 = should bersifat opsional

    // must_not: tidak boleh match (tidak mempengaruhi score)
    must_not: [
      { term: { category: 'dinding' } },
    ],
  },
}
```

**Kapan pakai `must` vs `filter`?**

| Kriteria         | `must`                                   | `filter`                                 |
|------------------|------------------------------------------|------------------------------------------|
| Mempengaruhi score | ✅ Ya                                   | ❌ Tidak                                 |
| Di-cache         | ❌ Tidak                                 | ✅ Ya (lebih cepat pada query berulang)   |
| Pakai untuk      | Relevansi teks (full-text queries)       | Kondisi boolean (exact, range, exists)   |

> **Aturan praktis:** Selalu gunakan `filter` untuk kondisi exact/range. Gunakan `must` hanya
> saat Anda butuh skor relevansi dari query tersebut.

### 3.4 Filtering vs Scoring

Score `_score` adalah nilai relevansi yang dihitung menggunakan **BM25** (Best Match 25),
standar industri untuk information retrieval. Semakin tinggi score, semakin relevan dokumen.

Komponen yang mempengaruhi BM25:
- **Term frequency (TF):** Seberapa sering kata muncul dalam dokumen.
- **Inverse document frequency (IDF):** Seberapa langka kata itu di seluruh corpus.
- **Field length normalization:** Dokumen pendek yang match lebih unggul dari dokumen panjang.

---

## 4. Aggregations — Analitik & Statistik

Aggregations adalah fitur yang memungkinkan Anda menghitung statistik di atas hasil pencarian.
Analoginya seperti `GROUP BY` + `COUNT` + `SUM` di SQL, tapi jauh lebih ekspresif.

```typescript
const result = await esService.getClient().search({
  index: 'products',
  query: { term: { inStock: true } },
  size: 0, // Tidak perlu hits, hanya aggregasi
  aggs: {
    // Hitung jumlah produk per kategori
    by_category: {
      terms: { field: 'category', size: 20 },
      aggs: {
        // Sub-aggregasi: rata-rata harga per kategori
        avg_price: { avg: { field: 'price' } },
      },
    },
    // Hitung rentang harga (facet)
    price_ranges: {
      range: {
        field: 'price',
        ranges: [
          { to: 50000 },
          { from: 50000, to: 200000 },
          { from: 200000 },
        ],
      },
    },
    // Nilai min, max, rata-rata harga
    price_stats: {
      stats: { field: 'price' },
    },
  },
});

// Akses hasilnya
const categories = result.aggregations?.by_category;
```

**Tipe Aggregasi Penting:**

| Aggregasi      | Fungsi                                                         |
|----------------|----------------------------------------------------------------|
| `terms`        | Group by distinct values (seperti `GROUP BY`)                  |
| `range`        | Group by rentang nilai                                         |
| `date_histogram`| Group by interval waktu (per hari, bulan, tahun)              |
| `avg`, `sum`, `min`, `max` | Kalkulasi numerik                              |
| `stats`        | min + max + avg + sum + count sekaligus                        |
| `cardinality`  | Hitung jumlah nilai unik (approx. COUNT DISTINCT)              |
| `nested`       | Aggregate di dalam nested documents                            |

---

## 5. kNN Search — Pencarian Vektor

**kNN (k-Nearest Neighbour)** adalah metode pencarian yang menemukan dokumen paling "dekat" dengan
sebuah vektor kueri dalam ruang N-dimensi. Ini adalah fondasi **semantic search** dan **RAG pipeline**.

### Mengapa Vektor?

Teks biasa tidak menangkap makna. Contoh:
- "mobil" ≠ "car" (secara teks), tapi secara makna **sama**.
- "bagus" dan "berkualitas" berbeda teks tapi dekat secara semantik.

Model embedding (seperti OpenAI `text-embedding-3-small` atau `all-MiniLM-L6-v2`) mengubah teks
menjadi vektor float. Teks yang maknanya mirip akan menghasilkan vektor yang **cosine-similar**.

### Cara Kerja HNSW

Elasticsearch menggunakan algoritma **HNSW (Hierarchical Navigable Small World)** yang membangun
graf bertingkat untuk navigasi cepat di ruang vektor — jauh lebih efisien dari brute-force
distance calculation.

Parameter HNSW:
- `m` (default: 16): jumlah koneksi per node. Lebih tinggi = lebih akurat tapi lebih lambat build + lebih besar.
- `ef_construction` (default: 100): ukuran candidate list saat build. Lebih tinggi = lebih akurat.
- `num_candidates`: ukuran candidate list saat search. Harus ≥ k, disarankan k × 10.

### Index Mapping untuk Vektor

```typescript
titleVector: {
  type: 'dense_vector',
  dims: 1536,          // Harus cocok dengan output model embedding
  index: true,         // WAJIB true untuk kNN search
  similarity: 'cosine', // Metrik jarak: cosine | l2_norm | dot_product
  index_options: {
    type: 'hnsw',
    m: 16,
    ef_construction: 100,
  },
},
```

**Perbandingan metrik similaritas:**

| Metrik          | Rumus                                     | Kapan digunakan                                        |
|-----------------|-------------------------------------------|--------------------------------------------------------|
| `cosine`        | $\cos\theta = \frac{A \cdot B}{\|A\|\|B\|}$ | Teks embedding (arah vektor lebih penting dari magnitude) |
| `dot_product`   | $A \cdot B$                               | Vektor yang sudah dinormalisasi (lebih cepat dari cosine) |
| `l2_norm`       | $\sqrt{\sum(A_i - B_i)^2}$               | Image embedding, koordinat fisik                       |

---

## 6. Hybrid Search & RRF

**Hybrid search** menggabungkan hasil pencarian teks (BM25) dengan hasil kNN (cosine similarity)
dalam satu query. Ini memberikan yang terbaik dari kedua dunia:
- BM25 unggul untuk keyword exact match ("SKU-001", brand name).
- kNN unggul untuk semantic/conceptual match ("ubin yang mirip kayu").

### Reciprocal Rank Fusion (RRF)

RRF adalah algoritma re-ranking yang menggabungkan dua ranked list:

$$
\text{RRF}(d) = \sum_{r \in R} \frac{1}{k + \text{rank}_r(d)}
$$

Di mana $k$ biasanya 60, dan $R$ adalah kumpulan ranked lists. RRF robust terhadap perbedaan
skala score — tidak perlu normalisasi manual.

```typescript
// Hybrid search otomatis tersedia di ElasticsearchService.hybridSearch()
const result = await esService.hybridSearch<Product>(
  'products',
  { multi_match: { query: 'keramik kayu alami', fields: ['title', 'description'] } },
  'titleVector',
  queryEmbedding, // float[] dari model embedding
  10,   // k
  100,  // numCandidates
  10,   // size hasil akhir
);
```

---

## 7. Arsitektur Modul di Codebase Ini

```
src/core/infrastructure/persistence/elasticsearch/
├── config/
│   ├── elasticsearch-config.type.ts   ← Tipe TypeScript untuk konfigurasi
│   └── elasticsearch.config.ts        ← registerAs() + validasi env vars
├── interfaces/
│   ├── index-mapping.interface.ts     ← Tipe IndexMapping, PropertyMapping, dll.
│   └── search-options.interface.ts    ← SearchOptions, BulkOperations, SearchResult
├── elasticsearch.constants.ts         ← Token ELASTICSEARCH_CLIENT
├── elasticsearch.service.ts           ← Service utama (inject ini ke feature service)
├── elasticsearch.module.ts            ← Global @Module, lifecycle management
└── elasticsearch.health.ts            ← Health indicator (standalone + Terminus-compatible)
```

**Alur dependency:**

```
AppModule
  └── ElasticsearchModule (Global)
        ├── ELASTICSEARCH_CLIENT  (raw @elastic/elasticsearch Client)
        ├── ElasticsearchService  ← feature services inject ini
        └── ElasticsearchHealthIndicator
```

Karena modul ini `@Global()`, Anda **tidak perlu** import `ElasticsearchModule` di setiap feature
module. Cukup inject `ElasticsearchService` langsung di constructor.

---

## 8. Panduan Penggunaan Praktis

### 8.1 Setup Environment Variables

Tambahkan ke file `.env`:

```bash
# Wajib
ELASTICSEARCH_NODE=http://localhost:9200

# Salah satu metode auth (pilih satu):
# Metode 1: Basic Auth
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password

# Metode 2: API Key (lebih disarankan untuk production)
# ELASTICSEARCH_API_KEY=base64_encoded_api_key

# Opsional (sudah ada default)
ELASTICSEARCH_REQUEST_TIMEOUT=30000
ELASTICSEARCH_MAX_RETRIES=3
ELASTICSEARCH_COMPRESSION=false
ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED=true  # false hanya untuk dev dengan self-signed cert
```

Jalankan Elasticsearch dengan Docker:

```bash
# Single node untuk development (tanpa security)
docker run -d --name elasticsearch \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -p 9200:9200 \
  docker.elastic.co/elasticsearch/elasticsearch:8.17.0
```

### 8.2 Membuat Index dengan Mapping

Buat sebuah file untuk mendefinisikan mapping index produk:

```typescript
// src/modules/products/infrastructure/elasticsearch/products.index.ts
import { IndexMapping } from 'src/core/infrastructure/persistence/elasticsearch/interfaces/index-mapping.interface';

export const PRODUCTS_INDEX = 'products';

export const PRODUCTS_INDEX_MAPPING: IndexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 1,
  },
  mappings: {
    dynamic: 'strict',
    properties: {
      id:          { type: 'keyword' },
      title:       { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
      description: { type: 'text' },
      brand:       { type: 'keyword' },
      category:    { type: 'keyword' },
      price:       { type: 'integer' },
      inStock:     { type: 'boolean' },
      createdAt:   { type: 'date' },
      titleVector: { type: 'dense_vector', dims: 1536, index: true, similarity: 'cosine' },
    },
  },
};
```

Buat index saat module init:

```typescript
// src/modules/products/infrastructure/elasticsearch/products-search.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService } from 'src/core/infrastructure/persistence/elasticsearch/elasticsearch.service';
import { PRODUCTS_INDEX, PRODUCTS_INDEX_MAPPING } from './products.index';

@Injectable()
export class ProductsSearchService implements OnModuleInit {
  private readonly logger = new Logger(ProductsSearchService.name);

  constructor(private readonly esService: ElasticsearchService) {}

  async onModuleInit() {
    await this.esService.createIndex(PRODUCTS_INDEX, PRODUCTS_INDEX_MAPPING);
    this.logger.log('Products Elasticsearch index ready.');
  }
}
```

### 8.3 Mengindeks Dokumen

```typescript
// Setelah produk dibuat di PostgreSQL, sync ke Elasticsearch
async indexProduct(product: Product): Promise<void> {
  const vector = await this.embeddingService.embed(product.title);

  await this.esService.indexDocument(
    PRODUCTS_INDEX,
    {
      id: product.id,
      title: product.title,
      description: product.description,
      brand: product.brand,
      category: product.category,
      price: product.price,
      inStock: product.stock > 0,
      createdAt: product.createdAt.toISOString(),
      titleVector: vector,
    },
    product.id, // Gunakan ID Postgres sebagai _id ES agar mudah di-update nanti
  );
}
```

### 8.4 Bulk Indexing

Gunakan `bulkIndex` saat mensinkronisasi banyak dokumen sekaligus (misal: re-index awal):

```typescript
// Proses dalam batch 500 untuk menghindari payload terlalu besar
const BATCH_SIZE = 500;

async reindexAllProducts(products: Product[]): Promise<void> {
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    // Generate embeddings dalam parallel
    const vectors = await Promise.all(
      batch.map((p) => this.embeddingService.embed(p.title)),
    );

    const operations = batch.map((product, idx) => ({
      index: PRODUCTS_INDEX,
      id: product.id,
      document: {
        id: product.id,
        title: product.title,
        price: product.price,
        inStock: product.stock > 0,
        titleVector: vectors[idx],
      },
    }));

    await this.esService.bulkIndex(operations);
    this.logger.log(`Indexed batch ${i / BATCH_SIZE + 1}`);
  }
}
```

### 8.5 Mencari Dokumen

```typescript
interface ProductHit {
  id: string;
  title: string;
  price: number;
  brand: string;
  inStock: boolean;
}

async searchProducts(dto: SearchProductsDto) {
  const { query, category, minPrice, maxPrice, page = 1, size = 10 } = dto;

  const result = await this.esService.search<ProductHit>({
    index: PRODUCTS_INDEX,
    from: (page - 1) * size,
    size,
    query: {
      bool: {
        // Pencarian teks di must supaya mempengaruhi relevance score
        must: query
          ? [{ multi_match: { query, fields: ['title^2', 'description'], fuzziness: 'AUTO' } }]
          : [{ match_all: {} }],
        // Filter di filter clause (lebih cepat, di-cache)
        filter: [
          ...(category ? [{ term: { category } }] : []),
          ...(minPrice || maxPrice
            ? [{ range: { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } }]
            : []),
          { term: { inStock: true } },
        ],
      },
    },
    // Sort: relevansi pertama, harga naik sebagai tiebreaker
    sort: [{ _score: 'desc' }, { price: 'asc' }],
    // Highlight kata yang match dalam hasil
    highlight: {
      fields: { title: {}, description: {} },
    },
  });

  return {
    total: result.total,
    page,
    size,
    products: result.hits.map((hit) => ({
      ...hit._source,
      score: hit._score,
    })),
  };
}
```

### 8.6 kNN Vector Search

```typescript
async semanticSearchProducts(naturalLanguageQuery: string, size = 10) {
  // 1. Ubah query teks menjadi vektor
  const queryVector = await this.embeddingService.embed(naturalLanguageQuery);

  // 2. Cari dengan kNN
  const result = await this.esService.knnSearch<ProductHit>(
    PRODUCTS_INDEX,
    'titleVector',
    queryVector,
    size,           // k: ambil top 10 terdekat
    size * 10,      // numCandidates: 100 kandidat di-evaluate
    { term: { inStock: true } }, // filter: hanya yang stok ada
  );

  return result.hits.map((hit) => hit._source);
}
```

### 8.7 Hybrid Search untuk RAG

```typescript
// Menggabungkan keyword search + semantic search untuk RAG pipeline
async hybridSearchForRAG(userQuestion: string) {
  const queryVector = await this.embeddingService.embed(userQuestion);

  const result = await this.esService.hybridSearch<ProductHit>(
    PRODUCTS_INDEX,
    {
      multi_match: {
        query: userQuestion,
        fields: ['title^2', 'description'],
      },
    },
    'titleVector',
    queryVector,
    10,   // k
    100,  // numCandidates
    5,    // Ambil 5 hasil terbaik setelah RRF merge
  );

  // Gunakan hasil sebagai context untuk LLM
  const context = result.hits
    .map((hit) => `${hit._source.title}: ${hit._source.description}`)
    .join('\n\n');

  return context;
}
```

### 8.8 Update & Delete

```typescript
// Partial update — hanya ubah price dan inStock
await esService.updateDocument(PRODUCTS_INDEX, productId, {
  price: 95000,
  inStock: false,
});

// Upsert — update jika ada, insert jika tidak
await esService.upsertDocument(
  PRODUCTS_INDEX,
  productId,
  { price: 95000 },  // doc: partial update
  { ...fullProductDoc }, // upsert: full document jika belum ada
);

// Hapus satu dokumen
await esService.deleteDocument(PRODUCTS_INDEX, productId);

// Hapus semua produk dengan kategori tertentu
const deletedCount = await esService.deleteByQuery(PRODUCTS_INDEX, {
  term: { category: 'discontinued' },
});
console.log(`Deleted ${deletedCount} documents`);
```

### 8.9 Health Check

```typescript
// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ElasticsearchHealthIndicator } from 'src/core/infrastructure/persistence/elasticsearch/elasticsearch.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly esHealth: ElasticsearchHealthIndicator,
  ) {}

  @Get()
  async check() {
    const elasticsearch = await this.esHealth.check();
    return { elasticsearch };
  }
}

// Response contoh:
// {
//   "elasticsearch": {
//     "status": "up",
//     "clusterStatus": "green",
//     "numberOfNodes": 1,
//     "responseTimeMs": 12
//   }
// }
```

---

## 9. Best Practices

### ✅ DO — Lakukan Ini

1. **Selalu definisikan mapping eksplisit sebelum indexing.**
   Dynamic mapping menghasilkan tipe yang tidak optimal (e.g., string jadi `text` DAN `keyword`, duplikasi storage).

2. **Gunakan `filter` bukan `must` untuk kondisi boolean/exact/range.**
   Filter di-cache, tidak menghitung BM25 score → 2–5x lebih cepat.

3. **Tambahkan `.keyword` sub-field untuk field `text` yang perlu sorting/aggregation.**
   Tidak bisa sort/aggregate field `text` secara langsung.

4. **Kelola bulk indexing dalam batch kecil (100–1000 dokumen).**
   Bulk request terlalu besar bisa menyebabkan circuit breaker ES terpicu.

5. **Set `number_of_replicas: 0` saat proses re-index massal, lalu kembalikan setelah selesai.**
   Menulis ke satu shard jauh lebih cepat dari menulis ke shard + replika.

6. **Gunakan ID yang konsisten antara Postgres dan Elasticsearch.**
   Gunakan Postgres UUID sebagai `_id` di ES → mudah sinkronisasi.

7. **Gunakan `_source: ['field1', 'field2']` untuk mengambil hanya field yang diperlukan.**
   Mengurangi network transfer dan parsing cost.

8. **Monitor cluster health dan jangan abaikan status `yellow`.**
   Yellow = beberapa replica shard tidak teralokasi (OK untuk single-node dev, masalah di production).

### ❌ DON'T — Hindari Ini

1. **Jangan gunakan `wildcard` atau `regexp` di production hot path.**
   Mereka tidak bisa menggunakan inverted index dengan efisien → full scan.

2. **Jangan ubah mapping field yang sudah ada.**
   Tidak bisa. Harus reindex (buat index baru, copy data, swap alias).

3. **Jangan tampilkan `_score` ke user untuk kNN-only search.**
   kNN score adalah raw cosine similarity [0,1], bukan "relevance percentage" yang informatif.

4. **Jangan setting `number_of_shards` terlalu tinggi untuk data kecil.**
   Terlalu banyak shard kecil lebih lambat dari sedikit shard besar. Rule of thumb: satu shard ≤ 50 GB.

5. **Jangan gunakan Elasticsearch sebagai primary database.**
   ES tidak ACID. Gunakan Postgres sebagai sumber kebenaran dan ES hanya untuk pencarian.

6. **Jangan call `refresh()` setelah setiap indexing dalam production.**
   `refresh` interval default 1 detik sudah cukup. Manual refresh mahal.

---

## 10. Perbandingan dengan Database Lain

| Aspek               | Elasticsearch     | PostgreSQL (LIKE/FTS) | Redis Search    | Qdrant          |
|---------------------|-------------------|-----------------------|-----------------|-----------------|
| Full-text search    | ✅ Sangat baik     | ⚠️ Terbatas           | ✅ Baik          | ❌ Bukan fokus  |
| Exact / range query | ✅ Baik            | ✅ Sangat baik         | ✅ Baik          | ⚠️ Terbatas     |
| Vector / kNN search | ✅ Sangat baik     | ⚠️ pgvector (OK)      | ✅ Baik          | ✅ Best-in-class|
| Aggregasi           | ✅ Sangat canggih  | ✅ Sangat baik         | ⚠️ Terbatas     | ❌ Minimal      |
| ACID                | ❌ Tidak          | ✅ Ya                  | ❌ Tidak        | ❌ Tidak        |
| Scaling horizontal  | ✅ Native          | ⚠️ Sulit              | ✅ Cluster mode  | ✅ Ya           |
| Operasi write       | ⚠️ Near real-time | ✅ Immediate           | ✅ Immediate     | ✅ OK           |
| Cocok untuk         | Search + analytics | Transactional data   | Cache + simple search | Pure vector search |

---

## 11. Cheatsheet Query DSL

```typescript
// ── Full-text ──────────────────────────────────────────────────────────────

// Match satu field
{ match: { title: 'keramik' } }

// Match dengan fuzziness (toleransi typo)
{ match: { title: { query: 'keramik', fuzziness: 'AUTO' } } }

// Cari di banyak field
{ multi_match: { query: 'keramik', fields: ['title^2', 'description'] } }

// Phrase match — kata berurutan persis
{ match_phrase: { title: 'keramik lantai motif' } }

// ── Term-level ────────────────────────────────────────────────────────────

// Exact match keyword
{ term: { category: 'lantai' } }

// Multiple exact values
{ terms: { brand: ['Arwana', 'Roman'] } }

// Range
{ range: { price: { gte: 50000, lte: 200000 } } }
{ range: { createdAt: { gte: 'now-7d/d' } } }

// Field ada (not null)
{ exists: { field: 'description' } }

// Prefix (autocomplete)
{ prefix: { 'title.keyword': 'ker' } }

// ── Bool ──────────────────────────────────────────────────────────────────

{
  bool: {
    must:     [ /* queries yang mempengaruhi score */ ],
    filter:   [ /* kondisi exact/range, tidak mempengaruhi score */ ],
    should:   [ /* opsional, meningkatkan score jika match */ ],
    must_not: [ /* yang TIDAK boleh match */ ],
    minimum_should_match: 1, // minimal N should harus match
  }
}

// ── Match All / None ──────────────────────────────────────────────────────

{ match_all: {} }  // Semua dokumen
{ match_none: {} } // Tidak ada dokumen

// ── Nested ────────────────────────────────────────────────────────────────

{
  nested: {
    path: 'variants',
    query: {
      bool: {
        must: [
          { term: { 'variants.color': 'putih' } },
          { range: { 'variants.stock': { gt: 0 } } },
        ],
      },
    },
  },
}

// ── Sorting ───────────────────────────────────────────────────────────────

sort: [
  { _score: 'desc' },         // Relevansi utama
  { price: 'asc' },           // Harga naik sebagai tiebreaker
  { createdAt: 'desc' },
]

// ── Pagination ────────────────────────────────────────────────────────────

from: (page - 1) * size,
size: size,

// ── Source Filtering ──────────────────────────────────────────────────────

_source: ['id', 'title', 'price'],        // Hanya ambil field ini
_source: { excludes: ['titleVector'] },    // Kecualikan field (jangan return vector besar)

// ── Highlight ─────────────────────────────────────────────────────────────

highlight: {
  pre_tags: ['<mark>'],
  post_tags: ['</mark>'],
  fields: {
    title: { number_of_fragments: 1 },
    description: { number_of_fragments: 3, fragment_size: 150 },
  },
}
```

---

*Dokumen ini mencakup semua konsep fundamental yang dibutuhkan untuk bekerja produktif dengan
Elasticsearch dalam konteks aplikasi NestJS. Untuk topik lanjutan seperti Index Lifecycle Management
(ILM), Cross-Cluster Search, Security & RBAC, dan Snapshot/Restore, lihat
[Elasticsearch official documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html).*
