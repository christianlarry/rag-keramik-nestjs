# Quick Reference: Hybrid RAG Implementation

## 🎯 TL;DR

**DON'T:** Upload product data sebagai documents setiap kali ada perubahan ❌  
**DO:** Gunakan hybrid approach - Database untuk products, RAG untuk knowledge ✅

---

## 📋 Quick Decision Tree

```
User bertanya tentang...

📦 PRODUCT AVAILABILITY?
   (Ada? Stok? Harga?)
   → Query PostgreSQL langsung
   → Fast (100-200ms)
   → Real-time data
   
📚 KNOWLEDGE/HOW-TO?
   (Cara? Tips? Panduan?)
   → RAG Search (Qdrant + LLM)
   → Rich answer (2-5s)
   → From documents
   
🎯 RECOMMENDATION?
   (Cocok? Bagus? Terbaik?)
   → Hybrid (Database + RAG)
   → Combine both
   → Comprehensive answer
```

---

## 🏗️ Architecture At-a-Glance

```
┌─────────────────────────────────────────────┐
│           USER QUESTIONS                     │
└─────────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Intent Classifier    │
         └──────────┬────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Database │  │   RAG    │  │  Hybrid  │
│  Query   │  │  Search  │  │   Both   │
└─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │             │
      ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Qdrant  │  │Both DBs +│
│          │  │  Vectors │  │LLM Merge │
│Real-time │  │+ Ollama  │  │          │
│Products  │  │LLM Gen   │  │          │
└──────────┘  └──────────┘  └──────────┘
```

---

## 🗂️ What Goes Where?

### PostgreSQL (Structured, Real-time)
```yaml
✅ Products:
   - SKU, name, price, stock
   - Attributes (size, color, grade)
   - Status (active/inactive)
   - Real-time updates
   
✅ Orders:
   - Order status, items, payment
   - Transaction history
   
✅ Users:
   - Email, name, role
   - Auth credentials
   
✅ Inventory:
   - Current stock levels
   - Reserved quantities
```

### Qdrant (Unstructured, Semantic)
```yaml
✅ Documents:
   - Katalog produk (PDF descriptions)
   - FAQ pelanggan
   - Panduan pemasangan
   - Artikel blog
   - Manual teknis
   
❌ BUKAN untuk:
   - Product specifications ← PostgreSQL!
   - Pricing data ← PostgreSQL!
   - Stock levels ← PostgreSQL!
```

---

## 🔀 Implementation Patterns

### Pattern 1: Database-Only Query
```typescript
// When: Product availability questions
// Example: "Ada keramik 30x30?"

async handleProductSearch(question: string) {
  // Extract filters
  const filters = extractFilters(question); // size: 30x30
  
  // Direct DB query
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      attributes: { path: ['size'], equals: '30x30' }
    },
    include: { inventory: true }
  });
  
  // Simple format
  return formatProductList(products);
}
```

### Pattern 2: RAG-Only Query
```typescript
// When: Knowledge/how-to questions
// Example: "Cara memasang keramik?"

async handleKnowledgeQuery(question: string) {
  // 1. Embed
  const embedding = await ollama.embed(question);
  
  // 2. Search Qdrant
  const chunks = await qdrant.search(embedding, topK: 5);
  
  // 3. LLM generate
  const answer = await ollama.generate({
    context: chunks.map(c => c.content),
    question: question,
  });
  
  return { answer, sources: chunks };
}
```

### Pattern 3: Hybrid Query
```typescript
// When: Recommendations, "best/cocok" questions
// Example: "Keramik terbaik untuk kolam renang?"

async handleHybridQuery(question: string) {
  // Parallel execution
  const [knowledge, products] = await Promise.all([
    // Get context from documents
    getRAGContext(question),
    
    // Get relevant products from DB
    getRelevantProducts(question),
  ]);
  
  // LLM combines both
  const answer = await ollama.generate({
    instruction: "Combine knowledge and product data",
    knowledge: knowledge,
    products: products,
    question: question,
  });
  
  return answer;
}
```

---

## 🎬 Example Scenarios

### Scenario A: Stock Check
```
User: "Keramik 30x30 warna putih masih ada?"

Flow:
1. Intent → PRODUCT_SEARCH
2. Extract → size:30x30, color:putih
3. SQL Query → PostgreSQL
4. Results → 5 products found
5. Response → "Ya, ada 5 produk..."

Time: ~150ms
Source: PostgreSQL only
```

### Scenario B: Installation Guide
```
User: "Cara pasang keramik di dinding kamar mandi?"

Flow:
1. Intent → KNOWLEDGE_QUERY
2. Embed → [0.234, 0.567, ...]
3. Qdrant Search → Top 5 chunks
4. LLM Generate → Detailed steps
5. Response → "Langkah-langkahnya..."

Time: ~3s
Source: Documents (Qdrant + Ollama)
```

### Scenario C: Recommendation
```
User: "Keramik anti-slip bagus untuk kolam renang?"

Flow:
1. Intent → HYBRID
2. Parallel:
   a) RAG → "Anti-slip R11+ for wet areas"
   b) DB → Products with antiSlip:true
3. LLM Merge → Combine knowledge + products
4. Response → "Untuk kolam renang, pilih R11+..."
              "Rekomendasi: [list products]"

Time: ~3s
Source: Both (PostgreSQL + Qdrant + Ollama)
```

---

## 📊 Performance Comparison

| Approach | Speed | Freshness | Complexity | Best For |
|----------|-------|-----------|------------|----------|
| DB Only | ⚡ 100ms | ✅ Real-time | 🟢 Simple | Product queries |
| RAG Only | 🐢 3s | ⚠️ Static | 🟡 Medium | Knowledge queries |
| Hybrid | 🐢 3s | ✅ Mixed | 🔴 Complex | Recommendations |

---

## 🚀 Implementation Checklist

### Phase 1: Basic Setup ✅
```
[ ] PostgreSQL schema (Products, Orders, Users)
[ ] REST API endpoints (/v1/products, etc.)
[ ] Qdrant setup + collection created
[ ] Ollama installed (LLM + embedding model)
[ ] Document upload endpoint
[ ] Document ingestion pipeline
[ ] Basic chat endpoint
```

### Phase 2: Hybrid RAG 🎯
```
[ ] Intent classification logic
[ ] Database query handler
[ ] RAG query handler
[ ] Hybrid query handler
[ ] Response formatting
[ ] Context metadata in responses
```

### Phase 3: Enhanced (Optional) 🔮
```
[ ] Product auto-sync to Qdrant
[ ] Advanced intent classification (LLM-based)
[ ] Multi-source ranking
[ ] Conversational memory
[ ] Analytics & monitoring
```

---

## 💡 Common Pitfalls & Solutions

### ❌ Pitfall 1: "Products sebagai Documents"
```
Problem: Upload CSV/PDF katalog produk setiap hari
Result: Outdated prices, wrong stock, manual work

Solution: Products di PostgreSQL (auto update via CRUD)
         Documents untuk content statis only
```

### ❌ Pitfall 2: "RAG untuk semua pertanyaan"
```
Problem: User tanya "Ada stok?" → RAG search documents
Result: Slow (3s) + possibly outdated answer

Solution: Intent classification → route ke DB langsung
         RAG hanya untuk knowledge queries
```

### ❌ Pitfall 3: "Embed semua atribut produk"
```
Problem: Setiap product attribute jadi vector
Result: Overhead besar, sync complex, duplicated data

Solution: Start simple - DB only untuk products
         Add semantic search later jika benar-benar perlu
```

---

## 🎓 Best Practices

### 1. Data Separation
```yaml
PostgreSQL (Transactional):
  - Frequent updates (products, orders, inventory)
  - Structured data with relations
  - Real-time accuracy required

Qdrant (Knowledge Base):
  - Infrequent updates (once per week/month)
  - Unstructured content (text, guides)
  - Semantic search needed
```

### 2. Intent Classification
```typescript
// Start with keyword matching
const hasProductKeywords = ['ada', 'stok', 'harga', 'berapa'];
const hasKnowledgeKeywords = ['cara', 'bagaimana', 'tips'];

// Upgrade to LLM later if needed
const intent = await llm.classify(question);
```

### 3. Response Format
```typescript
// Always include source attribution
{
  answer: "...",
  sources: {
    database: true/false,  // Used PostgreSQL?
    documents: [],         // Which docs used?
    products: []           // Which products returned?
  },
  confidence: 0.95,
  processingTime: "2.3s"
}
```

### 4. Monitoring
```typescript
// Track query patterns
metrics.increment('chat.query.product_search');
metrics.increment('chat.query.knowledge');
metrics.increment('chat.query.hybrid');

// Track performance
metrics.timing('chat.database_query', dbQueryTime);
metrics.timing('chat.rag_search', ragSearchTime);
metrics.timing('chat.llm_generation', llmTime);
```

---

## 📚 Related Docs

- [RAG_DOCUMENTS_EXPLAINED.md](./RAG_DOCUMENTS_EXPLAINED.md) - Deep dive tentang Documents
- [HYBRID_RAG_ARCHITECTURE.md](./HYBRID_RAG_ARCHITECTURE.md) - Architecture diagrams
- [OAUTH2_SETUP.md](./OAUTH2_SETUP.md) - OAuth2 implementation
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Step-by-step roadmap

---

## 🤝 Summary

1. **Products = PostgreSQL** (real-time, structured)
2. **Documents = Qdrant** (knowledge base, semantic)
3. **Chat = Hybrid** (route berdasarkan intent)
4. **Start simple** → scale as needed

**Key Insight:** Jangan paksa semua data ke vector database. Use the right tool for the right job! 🎯
