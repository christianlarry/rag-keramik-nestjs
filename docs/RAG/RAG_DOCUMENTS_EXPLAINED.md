# RAG Documents System - Penjelasan Lengkap

## 🤔 Apa itu Documents dalam RAG?

**Documents** adalah file-file sumber pengetahuan yang Anda upload ke sistem, seperti:
- 📄 Katalog produk keramik (PDF)
- 📋 FAQ pelanggan (DOCX/PDF)
- 📖 Manual pemasangan keramik (PDF)
- 📝 Panduan perawatan keramik (TXT)

File-file ini **BUKAN** disimpan di Qdrant! Qdrant hanya menyimpan **vector representations** (embeddings) dari potongan-potongan teks di file tersebut.

---

## 🔄 Alur Lengkap RAG Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    1️⃣  UPLOAD PHASE                              │
└─────────────────────────────────────────────────────────────────┘
Admin uploads "Katalog_Keramik_2024.pdf" (10 MB, 50 pages)
         ↓
    PostgreSQL: Document table
    - id: "doc-123"
    - title: "Katalog Keramik 2024"
    - filename: "Katalog_Keramik_2024.pdf"
    - status: "UPLOADED"
    - storageKey: "documents/doc-123.pdf"
         ↓
    Local Storage / S3: Physical file saved


┌─────────────────────────────────────────────────────────────────┐
│                2️⃣  INGESTION PHASE (Background Job)             │
└─────────────────────────────────────────────────────────────────┘
Admin triggers: POST /v1/documents/doc-123/ingest
         ↓
┌────────────────────────────────────┐
│   BullMQ Job Queue                 │
│   Job: "ingest-doc-123"            │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│  📖 Step 1: PARSING                │
│  Extract text from PDF             │
│  Result: "Keramik anti-slip..."    │
│          (full text, ~50k chars)   │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│  ✂️  Step 2: CHUNKING               │
│  Split into chunks                 │
│  - Chunk 1 (800 chars)             │
│  - Chunk 2 (800 chars)             │
│  - Chunk 3 (800 chars)             │
│  ... (total 100 chunks)            │
└────────────────────────────────────┘
         ↓
PostgreSQL: DocumentChunk table
    - id: "chunk-1", seq: 1, content: "Keramik anti-slip..."
    - id: "chunk-2", seq: 2, content: "Ukuran 30x30 cm..."
    - id: "chunk-3", seq: 3, content: "Grade KW1 harga..."
    ... (100 rows)
         ↓
┌────────────────────────────────────┐
│  🧮 Step 3: EMBEDDING               │
│  Convert to vectors (Ollama)       │
│                                    │
│  Chunk 1 → [0.234, 0.567, ...]    │
│  (768-dimensional vector)          │
│  Chunk 2 → [0.123, 0.789, ...]    │
│  Chunk 3 → [0.456, 0.234, ...]    │
│  ... (100 embeddings)              │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│  📊 Step 4: INDEXING TO QDRANT     │
│                                    │
│  Qdrant Collection: "keramik_docs" │
│                                    │
│  Point 1:                          │
│    id: "chunk-1"                   │
│    vector: [0.234, 0.567, ...]    │
│    payload: {                      │
│      documentId: "doc-123"        │
│      title: "Katalog 2024"        │
│      sourceType: "CATALOG"        │
│      chunkSeq: 1                  │
│      content: "Keramik anti..."   │
│    }                              │
│                                    │
│  Point 2: ...                      │
│  Point 3: ...                      │
│  ... (100 points)                  │
└────────────────────────────────────┘
         ↓
PostgreSQL: Document updated
    - status: "INDEXED" ✅


┌─────────────────────────────────────────────────────────────────┐
│                    3️⃣  QUERY PHASE (User Chat)                  │
└─────────────────────────────────────────────────────────────────┘
User asks: "Ada keramik anti-slip ukuran 30x30?"
         ↓
POST /v1/chat/ask
{
  "question": "Ada keramik anti-slip ukuran 30x30?"
}
         ↓
┌────────────────────────────────────┐
│  🧮 Embed Question (Ollama)         │
│  "Ada keramik..." →                │
│  [0.345, 0.678, 0.123, ...]       │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│  🔍 Vector Search in Qdrant        │
│  Find top 5 similar chunks         │
│                                    │
│  Results (sorted by score):        │
│  1. chunk-45 (score: 0.92)        │
│     "Keramik anti-slip uk 30x30"  │
│  2. chunk-23 (score: 0.87)        │
│     "Grade KW1 anti-slip..."      │
│  3. chunk-67 (score: 0.85)        │
│     "Harga Rp 85.000/box..."      │
│  4. chunk-12 (score: 0.81)        │
│     "Finishing matt anti-slip"    │
│  5. chunk-89 (score: 0.78)        │
│     "Indoor/outdoor ready"        │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│  🤖 LLM Generate Answer (Ollama)   │
│                                    │
│  Prompt:                           │
│  ---                               │
│  Context:                          │
│  [chunk-45 content]                │
│  [chunk-23 content]                │
│  [chunk-67 content]                │
│  [chunk-12 content]                │
│  [chunk-89 content]                │
│                                    │
│  Question:                         │
│  Ada keramik anti-slip 30x30?     │
│                                    │
│  Instructions:                     │
│  Answer based on context only.    │
│  If not found, say "I don't know" │
│  ---                               │
│                                    │
│  LLM Response:                     │
│  "Ya, kami memiliki keramik        │
│   anti-slip ukuran 30x30 cm       │
│   dengan grade KW1. Harga          │
│   Rp 85.000 per box. Finishing    │
│   matt anti-slip cocok untuk      │
│   indoor maupun outdoor..."       │
└────────────────────────────────────┘
         ↓
Response to User:
{
  "answer": "Ya, kami memiliki...",
  "contextUsed": [
    {
      "documentId": "doc-123",
      "documentTitle": "Katalog Keramik 2024",
      "chunkId": "chunk-45",
      "score": 0.92
    },
    ...
  ]
}
```

---

## 📊 Data Storage Breakdown

### 1. PostgreSQL (Transactional Data)
```sql
-- Document metadata
Document
  id, title, filename, mimeType, sizeBytes, 
  storageKey, sourceType, status, createdAt

-- Chunk metadata  
DocumentChunk
  id, documentId, seq, content (text copy), 
  vectorId (reference to Qdrant), metadata
```

### 2. File Storage (S3/Local)
```
documents/
  ├── doc-123.pdf (original file, 10 MB)
  ├── doc-456.docx
  └── doc-789.txt
```

### 3. Qdrant Vector Database
```json
{
  "collection": "keramik_documents",
  "points": [
    {
      "id": "chunk-1",
      "vector": [0.234, 0.567, 0.123, ...], // 768 dimensions
      "payload": {
        "documentId": "doc-123",
        "title": "Katalog Keramik 2024",
        "sourceType": "CATALOG",
        "chunkSeq": 1,
        "content": "Keramik anti-slip ukuran 30x30...",
        "createdAt": "2024-12-31T10:00:00Z"
      }
    },
    // ... 100 points for doc-123
    // ... points from other documents
  ]
}
```

---

## 🎯 Kenapa Perlu Documents Table?

### ❌ Tanpa Documents Table:
- Tidak tahu file mana yang sudah di-index
- Tidak bisa track status ingestion (UPLOADED/PROCESSING/INDEXED/FAILED)
- Tidak bisa re-index jika ada masalah
- Tidak bisa delete all chunks when document deleted
- Tidak ada audit trail

### ✅ Dengan Documents Table:
- Track lifecycle: UPLOADED → PROCESSING → INDEXED
- Bisa re-trigger ingestion jika gagal
- Cascade delete: hapus document = hapus semua chunks + vectors
- Metadata lengkap: filename, size, upload time, uploader
- Bisa filter: "tampilkan semua catalog documents"

---

## 🔧 API Operations

### Upload Document
```bash
POST /v1/documents
Content-Type: multipart/form-data

file: katalog.pdf
title: "Katalog Keramik 2024"
sourceType: "CATALOG"

Response:
{
  "id": "doc-123",
  "status": "UPLOADED", # Belum di-proses
  "title": "Katalog Keramik 2024"
}
```

### Trigger Ingestion
```bash
POST /v1/documents/doc-123/ingest

Response:
{
  "message": "Ingestion job enqueued",
  "jobId": "job-456"
}

# Background job akan:
# 1. Parse PDF
# 2. Chunk text
# 3. Generate embeddings
# 4. Index to Qdrant
# 5. Update status to "INDEXED"
```

### Check Status
```bash
GET /v1/documents/doc-123

Response:
{
  "id": "doc-123",
  "status": "INDEXED", # Siap digunakan!
  "chunksCount": 100,
  "title": "Katalog Keramik 2024"
}
```

### Delete Document
```bash
DELETE /v1/documents/doc-123

# Akan:
# 1. Delete from Qdrant (100 points)
# 2. Delete DocumentChunk rows (100 rows)
# 3. Delete Document row
# 4. Delete file from storage
```

### Ask Question (Uses Documents)
```bash
POST /v1/chat/ask
{
  "question": "Keramik anti-slip 30x30?"
}

# System automatically:
# 1. Embed question
# 2. Search Qdrant (across ALL indexed documents)
# 3. Get top K relevant chunks
# 4. Generate answer with LLM
```

---

## 🆚 Documents vs Qdrant

| Aspect | Documents (PostgreSQL) | Qdrant (Vector DB) |
|--------|------------------------|-------------------|
| **Stores** | Metadata & lifecycle | Vectors (embeddings) |
| **Purpose** | Management & tracking | Similarity search |
| **Data** | Document info, chunk text | Vector arrays |
| **Operations** | CRUD, status updates | Vector search, upsert |
| **Query** | By ID, status, type | By vector similarity |
| **Size** | Small (KB per document) | Large (MB per document) |

---

## 🔍 Example Scenario

### Scenario: Toko Keramik dengan 3 Dokumen

```
Document 1: "Katalog_2024.pdf" (CATALOG)
  → 100 chunks → 100 vectors in Qdrant
  
Document 2: "FAQ_Pelanggan.docx" (FAQ)
  → 50 chunks → 50 vectors in Qdrant
  
Document 3: "Panduan_Pemasangan.pdf" (GUIDE)
  → 75 chunks → 75 vectors in Qdrant

Total in Qdrant: 225 points (vectors)
```

### User Question: "Cara pasang keramik di kamar mandi?"

**Search Result dari Qdrant:**
1. ✅ Chunk from Document 3 (GUIDE) - score 0.95
2. ✅ Chunk from Document 2 (FAQ) - score 0.88
3. ✅ Chunk from Document 3 (GUIDE) - score 0.87
4. ✅ Chunk from Document 1 (CATALOG) - score 0.72
5. ❌ Chunk from Document 1 (CATALOG) - score 0.45 (irrelevant)

**LLM uses top 4 chunks to answer:**
"Untuk pemasangan keramik di kamar mandi, berikut langkah-langkahnya:
1. Pastikan dinding rata dan bersih...
2. Gunakan semen khusus waterproof...
3. Beri jarak nat 2-3mm...
[Sumber: Panduan Pemasangan, FAQ Pelanggan]"

---

## 🚀 Best Practices

### 1. Document Organization
```
sourceType: CATALOG   → Product info, specs, prices
sourceType: FAQ       → Common questions & answers
sourceType: GUIDE     → How-to, installation, maintenance
sourceType: MANUAL    → Technical specs, warranties
```

### 2. Chunking Strategy
```
- Size: 500-800 tokens (balance between context & granularity)
- Overlap: 50-100 tokens (prevent losing context at boundaries)
- Metadata: Include document title, page number, section
```

### 3. Re-indexing
```
When to re-index:
- Document updated (new version)
- Chunking strategy changed
- Embedding model updated
- Qdrant collection recreated
```

### 4. Monitoring
```
- Track ingestion success rate
- Monitor chunk count per document
- Alert on FAILED status documents
- Log Qdrant search performance
```

---

## 🎓 Summary

**Documents** = Source files with metadata
**DocumentChunks** = Split text pieces with Qdrant references  
**Qdrant Points** = Vector representations for similarity search
**RAG Flow** = Document → Chunks → Embeddings → Qdrant → Search → LLM → Answer

**Analogi Perpustakaan:**
- **Documents** = Daftar buku di perpustakaan (katalog)
- **Chunks** = Halaman-halaman dalam buku
- **Qdrant** = Sistem pencarian canggih yang bisa cari "buku dengan topik serupa"
- **RAG** = Pustakawan pintar yang baca buku relevan lalu jawab pertanyaan Anda

---

## ❓ FAQ: Bagaimana dengan Data Products dari Database?

### 🤔 Pertanyaan: "Products sering berubah, masa harus upload document terus?"

**TIDAK! Anda TIDAK perlu upload document untuk data products!** 

Ini adalah **misconception** yang umum. Mari saya jelaskan strategi yang benar:

---

## 🎯 Strategi: Hybrid Approach (RECOMMENDED)

### 📊 Structured Data (PostgreSQL) vs 📄 Unstructured Data (Documents)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA YANG ADA DI SISTEM                       │
└─────────────────────────────────────────────────────────────────┘

1️⃣  STRUCTURED DATA (PostgreSQL)
   ├─ Products (sku, name, price, stock, attributes)
   ├─ Orders (status, items, payment)
   ├─ Users (email, name, role)
   └─ Inventory (stock levels, reserved)
   
   ✅ Selalu real-time dan update
   ✅ Query via SQL/Prisma
   ✅ Akses via REST API endpoints
   
2️⃣  UNSTRUCTURED DATA (Documents → Qdrant)
   ├─ PDF Katalog (deskripsi detail produk, use cases)
   ├─ FAQ Pelanggan (pertanyaan umum, troubleshooting)
   ├─ Panduan Pemasangan (how-to, tips & tricks)
   ├─ Artikel Blog (inspirasi desain, trend)
   └─ Manual Teknis (spesifikasi mendalam, warranty)
   
   ✅ Konten statis/semi-static
   ✅ Query via vector similarity search
   ✅ Contextual, narrative content
```

---

## 🔄 Alur Implementasi RAG yang Benar

### Scenario 1: User Tanya tentang PRODUK SPESIFIK

**User:** "Ada keramik 30x30 warna putih?"

**System Flow:**
```
1. Deteksi: Ini pertanyaan tentang product availability
   ↓
2. Query PostgreSQL (real-time)
   SELECT * FROM Product 
   WHERE attributes->>'size' = '30x30'
   AND attributes->>'color' LIKE '%putih%'
   AND status = 'ACTIVE'
   ↓
3. Return hasil: 5 produk ditemukan
   ↓
4. LLM Format response dengan data real-time
```

**Response:**
```
"Ya, kami memiliki 5 keramik putih ukuran 30x30:

1. Keramik Putih Glossy KW1 - Rp 85.000/box (Stok: 150)
2. Keramik Putih Matt KW Super - Rp 95.000/box (Stok: 200)
3. ...

[Data real-time dari database]"
```

---

### Scenario 2: User Tanya tentang CARA PAKAI / TIPS

**User:** "Keramik 30x30 cocok untuk ruangan berapa meter?"

**System Flow:**
```
1. Deteksi: Ini pertanyaan about knowledge/advice
   ↓
2. Embed question → [0.234, 0.567, ...]
   ↓
3. Vector search Qdrant (Documents)
   - Top chunks from "Panduan Pembelian.pdf"
   - Top chunks from "FAQ Pelanggan.docx"
   ↓
4. LLM generate answer dengan context dari documents
```

**Response:**
```
"Keramik 30x30 cocok untuk ruangan 3x3 meter hingga 5x5 meter.

Perhitungan:
- 1 box keramik 30x30 = 10 keping = 0.9 m²
- Ruangan 3x3m = 9 m² = butuh ~10 box
- Ruangan 5x5m = 25 m² = butuh ~28 box

Tips: Tambah 10% untuk cadangan pemotongan.

[Sumber: Panduan Pembelian Keramik, hal 15]"
```

---

### Scenario 3: User Tanya KOMBINASI (Product + Knowledge)

**User:** "Keramik anti-slip yang bagus untuk kamar mandi?"

**System Flow - HYBRID:**
```
1. Phase 1: Vector Search (Qdrant)
   Question → Embed → Search documents
   Context: "Anti-slip rating, finishing matt, indoor..."
   ↓
2. Phase 2: Database Query (PostgreSQL)
   Filter products based on context:
   WHERE attributes->>'antiSlip' = true
   AND attributes->>'indoor' = true
   ↓
3. Phase 3: LLM Combine
   Context from documents + Product data from DB
   ↓
4. Generate comprehensive answer
```

**Response:**
```
"Untuk kamar mandi, pilih keramik dengan:
- Finishing matt/natural (bukan glossy)
- Rating anti-slip minimal R10
- Pori-pori tertutup (low water absorption)

Rekomendasi produk kami:

1. Keramik Anti-Slip Natural KW1 30x30
   Rp 95.000/box | Stok: 200 | Rating: R11
   
2. Keramik Matt Bathroom Series 40x40
   Rp 120.000/box | Stok: 150 | Rating: R10

[Knowledge from: FAQ Pelanggan]
[Product data: Real-time from database]"
```

---

## 🛠️ Implementation Strategy

### Chat Service Logic (`src/chat/chat.service.ts`)

```typescript
async handleUserQuestion(question: string) {
  // 1. Classify intent
  const intent = await this.classifyIntent(question);
  
  switch (intent) {
    case 'PRODUCT_SEARCH':
      // Direct database query
      return this.handleProductSearch(question);
      
    case 'KNOWLEDGE_QUERY':
      // RAG with documents
      return this.handleRAGQuery(question);
      
    case 'HYBRID':
      // Combine both
      return this.handleHybridQuery(question);
      
    default:
      return this.handleRAGQuery(question);
  }
}

// Direct database query untuk product availability
async handleProductSearch(question: string) {
  // Extract filters dari question (bisa pakai LLM)
  const filters = await this.extractProductFilters(question);
  
  // Query database
  const products = await this.prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...filters,
    },
    include: { inventory: true },
  });
  
  // Format dengan LLM
  return this.formatProductResults(products, question);
}

// RAG query untuk knowledge
async handleRAGQuery(question: string) {
  // Embed question
  const embedding = await this.embeddingService.embed(question);
  
  // Search Qdrant
  const context = await this.vectorService.search(embedding, 5);
  
  // Generate answer dengan LLM
  return this.llmService.generate({
    context,
    question,
  });
}

// Hybrid: combine database + RAG
async handleHybridQuery(question: string) {
  // Get both
  const [context, products] = await Promise.all([
    this.getRAGContext(question),
    this.getRelevantProducts(question),
  ]);
  
  // LLM dengan both sources
  return this.llmService.generate({
    context,
    products,
    question,
  });
}
```

---

## 📋 Kapan Pakai Database vs RAG?

### ✅ Gunakan DATABASE QUERY jika:
- ❓ "Ada keramik 30x30 warna abu-abu?"
- ❓ "Berapa harga keramik merk XYZ?"
- ❓ "Stok keramik SKU-123 masih ada?"
- ❓ "Keramik termurah di bawah 100 ribu?"

**Ciri:** Pertanyaan tentang **data real-time, spesifik, structured**

### ✅ Gunakan RAG (Documents) jika:
- ❓ "Cara memasang keramik di dinding?"
- ❓ "Perbedaan grade KW1 dan KW2?"
- ❓ "Tips memilih keramik untuk dapur?"
- ❓ "Apa itu rating anti-slip?"

**Ciri:** Pertanyaan tentang **knowledge, how-to, conceptual**

### ✅ Gunakan HYBRID jika:
- ❓ "Keramik anti-slip terbaik untuk kolam renang?"
  → Knowledge (apa itu anti-slip) + Products (list products)
- ❓ "Keramik modern untuk ruang tamu minimalis?"
  → Knowledge (style modern minimalis) + Products (filtered)

---

## 🚀 Advanced: Auto-Sync Products ke Qdrant (Optional)

Jika Anda **tetap ingin** product data di Qdrant (untuk semantic search), bisa pakai auto-sync:

### Event-Driven Sync

```typescript
// src/products/products.service.ts

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private vectorService: VectorService,
    private embeddingService: EmbeddingService,
  ) {}

  async createProduct(data: CreateProductDto) {
    // 1. Create in database
    const product = await this.prisma.product.create({ data });
    
    // 2. Sync to Qdrant (background job)
    await this.syncProductToQdrant(product);
    
    return product;
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    // 1. Update in database
    const product = await this.prisma.product.update({
      where: { id },
      data,
    });
    
    // 2. Sync to Qdrant
    await this.syncProductToQdrant(product);
    
    return product;
  }

  async deleteProduct(id: string) {
    // 1. Delete from database
    await this.prisma.product.delete({ where: { id } });
    
    // 2. Delete from Qdrant
    await this.vectorService.deletePoint(`product-${id}`);
  }

  private async syncProductToQdrant(product: Product) {
    // Generate searchable text
    const searchableText = `
      ${product.name}
      Brand: ${product.brand}
      Description: ${product.description}
      Price: ${product.price}
      Attributes: ${JSON.stringify(product.attributes)}
    `;
    
    // Generate embedding
    const embedding = await this.embeddingService.embed(searchableText);
    
    // Upsert to Qdrant
    await this.vectorService.upsert({
      id: `product-${product.id}`,
      vector: embedding,
      payload: {
        type: 'PRODUCT',
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        status: product.status,
        searchableText,
      },
    });
  }
}
```

### Benefit Auto-Sync:
- ✅ Semantic search: "keramik modern" → dapat produk dengan style modern
- ✅ Typo-tolerant: "kremik" → tetap dapat "keramik"
- ✅ Conceptual search: "lantai dapur" → dapat produk yang cocok

### Trade-off:
- ❌ Kompleksitas lebih tinggi
- ❌ Sync overhead setiap CRUD
- ❌ Data duplicated (PostgreSQL + Qdrant)

---

## 📊 Architecture Comparison

### Option A: Database Only (Simple)
```
User Question
    ↓
Direct SQL Query
    ↓
Products from PostgreSQL
    ↓
Response
```
✅ Simple, real-time  
❌ Tidak bisa jawab knowledge questions

---

### Option B: RAG Only (Knowledge-focused)
```
User Question
    ↓
RAG Search (Documents)
    ↓
Context from Qdrant
    ↓
LLM Answer
```
✅ Good for knowledge  
❌ Product data outdated (dari PDF lama)

---

### Option C: Hybrid (RECOMMENDED) ⭐
```
User Question
    ↓
Intent Classification
    ├─ Product Search → PostgreSQL
    ├─ Knowledge Query → RAG (Documents)
    └─ Hybrid → Both
    ↓
Combine Results
    ↓
LLM Format
    ↓
Response
```
✅ Best of both worlds  
✅ Real-time products + rich knowledge  
✅ Flexible

---

### Option D: Auto-Sync Products (Advanced)
```
Product CRUD
    ↓
PostgreSQL (source of truth)
    ↓ (trigger sync)
Qdrant (semantic search copy)

User Question
    ↓
Semantic Search (Qdrant)
    ↓
Get full data (PostgreSQL)
    ↓
Response
```
✅ Semantic search on products  
✅ Real-time via PostgreSQL join  
⚠️ More complex

---

## 🎯 Recommendation untuk Keramik Store

### Phase 1: Start Simple (Hybrid Basic)
```
Products → PostgreSQL only (real-time API)
Documents → Qdrant RAG (katalog PDF, FAQ, guides)
Chat → Classify intent → Route ke DB atau RAG
```

### Phase 2: Enhanced (jika perlu semantic product search)
```
Products → PostgreSQL (source of truth)
         → Qdrant (auto-synced untuk semantic search)
Documents → Qdrant RAG
Chat → Hybrid search (products + documents)
```

---

## 💡 Kesimpulan

1. **Documents bukan untuk data products!**
   - Documents = katalog PDF, FAQ, guides (konten statis)
   - Products = database PostgreSQL (data real-time)

2. **Gunakan Hybrid Approach:**
   - Database query untuk product availability
   - RAG untuk knowledge & advice
   - Combine keduanya untuk best experience

3. **Auto-sync products ke Qdrant hanya jika:**
   - Perlu semantic search ("keramik modern")
   - Perlu typo-tolerance
   - Worth the complexity trade-off

4. **Start simple, scale as needed:**
   - Phase 1: Database + RAG (terpisah)
   - Phase 2: Add auto-sync jika diperlukan

Semoga jelas sekarang! 🚀
