# Hybrid RAG Strategy - Architecture Diagram

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KERAMIK STORE BACKEND                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   CLIENT    │
                              │ (Frontend)  │
                              └──────┬──────┘
                                     │
                                     │ HTTP Request
                                     ▼
                    ┌────────────────────────────────┐
                    │      NestJS API Gateway         │
                    │    /v1/chat/ask                 │
                    │    /v1/products                 │
                    └────────────┬───────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌─────────────────────┐   ┌─────────────────────┐
        │   Chat Service      │   │  Products Service   │
        │                     │   │                     │
        │ • Intent Classify   │   │ • CRUD Products     │
        │ • Route to handler  │   │ • Inventory Mgmt    │
        └──────────┬──────────┘   └──────────┬──────────┘
                   │                          │
         ┌─────────┼─────────┐               │
         │         │         │               │
         ▼         ▼         ▼               ▼
    ┌──────┐  ┌──────┐  ┌──────┐      ┌──────────┐
    │  DB  │  │ RAG  │  │Hybrid│      │PostgreSQL│
    │Query │  │Search│  │ Both │      │          │
    └──┬───┘  └──┬───┘  └──┬───┘      │ Products │
       │         │         │           │ Orders   │
       │         │         │           │ Users    │
       │         │         │           │ Inventory│
       │         │         │           └────┬─────┘
       │         │         │                │
       │         │         └────────────────┤
       │         │                          │
       │         │                          ▼
       │         │                    ┌──────────┐
       │         │                    │  Real-   │
       │         │                    │  time    │
       │         │                    │  Data    │
       │         │                    └──────────┘
       │         │
       │         ▼
       │    ┌─────────────────────────────┐
       │    │    RAG Pipeline             │
       │    │                             │
       │    │  1. Embed Question          │
       │    │     (Ollama)                │
       │    │         ↓                   │
       │    │  2. Vector Search           │
       │    │     (Qdrant)                │
       │    │         ↓                   │
       │    │  3. Get Context             │
       │    │     (Top-K chunks)          │
       │    │         ↓                   │
       │    │  4. LLM Generate            │
       │    │     (Ollama)                │
       │    └──────────┬──────────────────┘
       │               │
       └───────────────┼───────────────────┐
                       │                   │
                       ▼                   ▼
              ┌─────────────────┐   ┌─────────────────┐
              │   Qdrant DB     │   │  Ollama LLM     │
              │                 │   │                 │
              │ • Documents     │   │ • llama3.2:3b   │
              │   vectors       │   │ • nomic-embed   │
              │ • Metadata      │   │                 │
              │ • Similarity    │   │                 │
              │   search        │   │                 │
              └─────────────────┘   └─────────────────┘
                      ▲
                      │
                      │ Indexed from
                      │
              ┌───────┴─────────┐
              │   Documents     │
              │                 │
              │ • katalog.pdf   │
              │ • faq.docx      │
              │ • guides.pdf    │
              │                 │
              │ (S3/Local)      │
              └─────────────────┘
```

---

## 🔀 Request Flow Examples

### Example 1: Product Availability Query

```
User: "Ada keramik 30x30 warna putih?"
   │
   ├─ Intent: PRODUCT_SEARCH
   │
   ▼
┌──────────────────────────────────────┐
│ Chat Service                         │
│ → handleProductSearch()              │
└────────────┬─────────────────────────┘
             │
             │ 1. Extract filters
             │    size: "30x30"
             │    color: "putih"
             │
             ▼
┌──────────────────────────────────────┐
│ PostgreSQL Query                     │
│                                      │
│ SELECT * FROM Product                │
│ WHERE status = 'ACTIVE'              │
│ AND attributes->>'size' = '30x30'   │
│ AND attributes->>'color' LIKE '%...'│
└────────────┬─────────────────────────┘
             │
             │ Results: 5 products
             │
             ▼
┌──────────────────────────────────────┐
│ LLM Format (Simple)                  │
│                                      │
│ "Ya, ada 5 produk:                   │
│  1. Keramik A - Rp 85k (Stok: 150)  │
│  2. Keramik B - Rp 95k (Stok: 200)" │
└────────────┬─────────────────────────┘
             │
             ▼
        Response JSON
```

**Time:** ~100-200ms (fast, direct DB)

---

### Example 2: Knowledge Query

```
User: "Cara memasang keramik di kamar mandi?"
   │
   ├─ Intent: KNOWLEDGE_QUERY
   │
   ▼
┌──────────────────────────────────────┐
│ Chat Service                         │
│ → handleRAGQuery()                   │
└────────────┬─────────────────────────┘
             │
             │ 1. Embed question
             ▼
┌──────────────────────────────────────┐
│ Ollama Embedding                     │
│ Text → [0.234, 0.567, 0.123, ...]   │
└────────────┬─────────────────────────┘
             │
             │ 2. Vector search
             ▼
┌──────────────────────────────────────┐
│ Qdrant Search                        │
│                                      │
│ Top 5 results:                       │
│ • chunk-45 (score: 0.92)            │
│   "Panduan_Pemasangan.pdf"          │
│ • chunk-23 (score: 0.88)            │
│   "FAQ_Pelanggan.docx"              │
│ • chunk-67 (score: 0.85)            │
│   "Manual_Teknis.pdf"               │
└────────────┬─────────────────────────┘
             │
             │ 3. Compose prompt
             ▼
┌──────────────────────────────────────┐
│ LLM Generation (Ollama)              │
│                                      │
│ Prompt:                              │
│ Context: [5 chunks text]             │
│ Question: Cara memasang...?          │
│ Instructions: Answer based on ctx    │
│                                      │
│ Response:                            │
│ "Untuk memasang keramik di kamar    │
│  mandi, langkah-langkahnya:         │
│  1. Pastikan dinding rata...        │
│  2. Gunakan semen waterproof...     │
│  [Sumber: Panduan Pemasangan]"      │
└────────────┬─────────────────────────┘
             │
             ▼
        Response JSON
        + Context metadata
```

**Time:** ~2-5 seconds (LLM generation)

---

### Example 3: Hybrid Query

```
User: "Keramik anti-slip untuk kolam renang?"
   │
   ├─ Intent: HYBRID
   │
   ▼
┌──────────────────────────────────────┐
│ Chat Service                         │
│ → handleHybridQuery()                │
└────────────┬─────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
┌─────────┐    ┌────────────┐
│   RAG   │    │  Database  │
│ Search  │    │   Query    │
│         │    │            │
│ Get     │    │ Get        │
│ context │    │ products   │
│ about   │    │ with       │
│ anti-   │    │ anti-slip  │
│ slip    │    │ = true     │
│ rating  │    │            │
└────┬────┘    └─────┬──────┘
     │               │
     └───────┬───────┘
             │
             │ Parallel execution
             │
             ▼
┌──────────────────────────────────────┐
│ Combine Results                      │
│                                      │
│ Context from documents:              │
│ "Anti-slip rating R11 cocok untuk   │
│  area basah seperti kolam renang"   │
│                                      │
│ Products from database:              │
│ • Keramik A (R11) - Rp 120k         │
│ • Keramik B (R12) - Rp 150k         │
└────────────┬─────────────────────────┘
             │
             │ LLM merge & format
             ▼
┌──────────────────────────────────────┐
│ Comprehensive Response               │
│                                      │
│ "Untuk kolam renang, pilih keramik  │
│  dengan rating anti-slip minimal    │
│  R11 (standar untuk area sangat     │
│  basah).                             │
│                                      │
│  Rekomendasi:                        │
│  1. Keramik A (R11) - Rp 120k       │
│  2. Keramik B (R12) - Rp 150k       │
│                                      │
│  [Knowledge: FAQ + Manual]           │
│  [Products: Real-time DB]"           │
└────────────┬─────────────────────────┘
             │
             ▼
        Response JSON
```

**Time:** ~2-5 seconds (parallel execution helps)

---

## 🎯 Intent Classification Logic

```typescript
// Simplified intent classification

function classifyIntent(question: string): Intent {
  const lowerQ = question.toLowerCase();
  
  // Keywords for product search
  const productKeywords = [
    'ada', 'stok', 'harga', 'berapa', 'jual',
    'tersedia', 'ready', 'stock', 'price'
  ];
  
  // Keywords for knowledge
  const knowledgeKeywords = [
    'cara', 'bagaimana', 'kenapa', 'apa itu',
    'perbedaan', 'tips', 'panduan', 'how to'
  ];
  
  // Keywords for hybrid
  const hybridKeywords = [
    'rekomendasi', 'cocok', 'bagus', 'terbaik',
    'recommend', 'suitable', 'best'
  ];
  
  // Check matches
  const hasProduct = productKeywords.some(k => lowerQ.includes(k));
  const hasKnowledge = knowledgeKeywords.some(k => lowerQ.includes(k));
  const hasHybrid = hybridKeywords.some(k => lowerQ.includes(k));
  
  if (hasHybrid) return 'HYBRID';
  if (hasProduct && !hasKnowledge) return 'PRODUCT_SEARCH';
  if (hasKnowledge && !hasProduct) return 'KNOWLEDGE_QUERY';
  
  // Default to RAG for ambiguous cases
  return 'KNOWLEDGE_QUERY';
}

// Advanced: Use LLM for classification
async function classifyIntentWithLLM(question: string): Promise<Intent> {
  const prompt = `
Classify this question into one of:
- PRODUCT_SEARCH: asking about product availability, price, stock
- KNOWLEDGE_QUERY: asking how-to, concepts, advice
- HYBRID: asking for recommendations combining both

Question: "${question}"

Response (one word only):`;
  
  const result = await llm.generate(prompt);
  return result.trim().toUpperCase();
}
```

---

## 📊 Data Flow Comparison

### Traditional E-commerce (No RAG)
```
User Question
    ↓
Keyword Search (SQL LIKE)
    ↓
Products List
    ↓
Done ✅

Pros:
✅ Fast
✅ Simple
✅ Real-time

Cons:
❌ No knowledge support
❌ Can't answer "how-to"
❌ Keyword matching only
```

---

### RAG Only (No Database Integration)
```
User Question
    ↓
Vector Search (Documents)
    ↓
Context Chunks
    ↓
LLM Answer
    ↓
Done ✅

Pros:
✅ Rich knowledge
✅ Natural language
✅ Semantic search

Cons:
❌ Product data outdated
❌ Can't check real stock
❌ Slower responses
```

---

### Hybrid Approach (BEST) ⭐
```
User Question
    ↓
Intent Classification
    ├─ Product? → DB (fast)
    ├─ Knowledge? → RAG (rich)
    └─ Both? → Hybrid
    ↓
Combine & Format
    ↓
Done ✅

Pros:
✅ Best of both worlds
✅ Real-time products
✅ Rich knowledge base
✅ Flexible routing

Cons:
⚠️ More complex logic
⚠️ Need maintain both
```

---

## 🔄 Product Auto-Sync Flow (Optional/Advanced)

```
┌─────────────────────────────────────┐
│  Admin: Create/Update Product       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PostgreSQL                         │
│  INSERT/UPDATE Product              │
│  (Source of Truth)                  │
└──────────────┬──────────────────────┘
               │
               │ Trigger
               ▼
┌─────────────────────────────────────┐
│  BullMQ Job Queue                   │
│  Job: "sync-product-to-qdrant"      │
└──────────────┬──────────────────────┘
               │
               │ Background Process
               ▼
┌─────────────────────────────────────┐
│  1. Generate Searchable Text        │
│                                     │
│  Text = product.name +              │
│         product.description +       │
│         product.attributes +        │
│         product.brand               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Generate Embedding (Ollama)     │
│                                     │
│  Text → [0.234, 0.567, ...]        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Upsert to Qdrant                │
│                                     │
│  Point:                             │
│    id: "product-{productId}"        │
│    vector: [...]                    │
│    payload: {                       │
│      type: "PRODUCT",               │
│      productId: "...",              │
│      sku: "...",                    │
│      name: "...",                   │
│      price: ...,                    │
│    }                                │
└──────────────┬──────────────────────┘
               │
               ▼
         Done ✅
         
Now user can search semantically:
"keramik modern" → finds products with modern style
"lantai dapur" → finds products suitable for kitchen
```

### Benefit:
```
Traditional Search:
Query: "keramik modern"
SQL: WHERE name LIKE '%modern%'
Result: Only products with word "modern" in name ❌

Semantic Search (with auto-sync):
Query: "keramik modern"
Vector: [0.345, 0.678, ...]
Search: Similarity in Qdrant
Result: Products with modern style, contemporary,
        minimalist, etc. ✅ (even without word "modern")
```

---

## 💾 Storage Size Estimation

### For 1000 Products + 100 Documents

```
PostgreSQL:
├─ Products: 1000 rows × ~2 KB = ~2 MB
├─ Orders: Variable (assume 10K orders = ~50 MB)
├─ Users: 5000 users × ~1 KB = ~5 MB
└─ Total: ~60 MB

Qdrant:
├─ Documents (100 files):
│  ├─ Average: 50 pages × 1000 chars/page = 50K chars
│  ├─ Chunks: 50K / 800 = ~63 chunks per doc
│  ├─ Total chunks: 100 docs × 63 = 6,300 chunks
│  ├─ Vector size: 768 dims × 4 bytes = 3 KB
│  └─ Total: 6,300 × 3 KB = ~19 MB
│
├─ Products (if auto-synced):
│  ├─ 1000 products
│  ├─ Vector size: 768 dims × 4 bytes = 3 KB
│  └─ Total: 1000 × 3 KB = ~3 MB
│
└─ Total: ~22 MB (or ~19 MB without product sync)

File Storage (S3/Local):
├─ Documents: 100 files × 5 MB avg = ~500 MB
└─ Product images: 1000 images × 200 KB = ~200 MB

Grand Total: ~782 MB for complete system
```

Pretty manageable! 🚀

---

## 🎯 Recommendation Summary

### Phase 1: MVP (Recommended Start)
```yaml
Products:
  - Store: PostgreSQL only
  - Access: REST API endpoints
  - Search: SQL filters + full-text search
  
Documents:
  - Store: Qdrant vectors + S3/local files
  - Access: RAG pipeline
  - Search: Vector similarity
  
Chat:
  - Route: Intent-based (product vs knowledge)
  - Response: Combine both as needed
```

### Phase 2: Enhanced (If Needed Later)
```yaml
Products:
  - Store: PostgreSQL (source of truth)
  - Sync: Auto-sync to Qdrant (semantic search)
  - Access: Both SQL and vector search
  
Documents:
  - Same as Phase 1
  
Chat:
  - Enhanced: Multi-modal search
  - Advanced: Product recommendations
```

Start simple, scale smart! 🎯
