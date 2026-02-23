# E-Commerce Flow & Use Cases — Keramik Store Platform

## 1. Aktor & Peran

| Aktor | Role | Akses |
|---|---|---|
| **Customer** | `CUSTOMER` | Browsing, cart, checkout, bayar, lihat order sendiri |
| **Admin** | `ADMIN` | CRUD produk, kelola stok, pantau semua order & payment, kelola diskon |
| **Staff** | `STAFF` | Akses operasional terbatas (subset Admin) |
| **System** | — | Midtrans webhook, background jobs |

---

## 2. Domain & Entitas Utama

```
Product ──< Inventory
   │
   └──< OrderItem >── Order ──< Payment
                        │
CartItem >── Cart        └── (checkout)
                         
Discount ──── (apply to Order)
```

| Entitas | Deskripsi |
|---|---|
| `Product` | Katalog item: SKU, nama, harga, brand, atribut (ukuran, motif, dll) |
| `Inventory` | Stok per produk: total, reserved, available |
| `Cart` + `CartItem` | Keranjang belanja per customer (satu cart aktif per user) |
| `Order` + `OrderItem` | Transaksi final dari checkout; snapshot harga saat order |
| `Payment` | Representasi transaksi Midtrans yang terikat ke satu Order |
| `Discount` | Kode voucher / promo: persentase atau nominal, dengan periode & limit |

---

## 3. Use Cases

### 3.1 Product Management (Admin)

**UC-P1: Buat Produk Baru**
```
Admin → POST /v1/products
      → Sistem simpan produk + buat record Inventory (stok = 0)
```

**UC-P2: Update Produk**
```
Admin → PATCH /v1/products/{id}
      → Update atribut produk (nama, harga, deskripsi, dll)
```

**UC-P3: Hapus Produk**
```
Admin → DELETE /v1/products/{id}
      → Produk dihapus (atau soft-delete jika ada order terkait)
```

**UC-P4: Kelola Stok Inventori**
```
Admin → PATCH /v1/inventory/{productId}
      → Adjust stok (masuk barang, koreksi, dsb)
```

---

### 3.2 Product Browsing (Customer / Public)

**UC-B1: Browsing Katalog Produk**
```
Public → GET /v1/products?search=&brand=&minPrice=&maxPrice=&sortBy=&page=&limit=
       ← Daftar produk paginasi dengan filter & sorting
```

**UC-B2: Lihat Detail Produk**
```
Public → GET /v1/products/{id}
       ← Detail produk: atribut lengkap, harga, brand, dll
```

**UC-B3: Cek Stok Produk**
```
Customer → GET /v1/inventory/{productId}
         ← Info stok: total, reserved, available
```

---

### 3.3 Cart Management (Customer)

**UC-C1: Lihat Cart**
```
Customer → GET /v1/cart
         ← Cart aktif beserta semua CartItem (productId, qty, harga)
```

**UC-C2: Tambah Item ke Cart**
```
Customer → POST /v1/cart/items
         Body: { productId, quantity }
         
Sistem:
  1. Cek stok tersedia (available >= quantity)
  2. Jika produk sudah ada di cart → tambah quantity
  3. Jika baru → buat CartItem baru
  ← CartItem berhasil ditambahkan
```

**UC-C3: Update Quantity Item di Cart**
```
Customer → PATCH /v1/cart/items/{itemId}
         Body: { quantity }
         
Sistem:
  1. Cek stok tersedia untuk quantity baru
  2. Update quantity CartItem
```

**UC-C4: Hapus Item dari Cart**
```
Customer → DELETE /v1/cart/items/{itemId}
         ← Item dihapus dari cart
```

**UC-C5: Kosongkan Cart**
```
Customer → DELETE /v1/cart/clear
         ← Semua item di cart dihapus
```

---

### 3.4 Checkout & Order (Customer)

**UC-O1: Checkout (Buat Order)**

Ini adalah use case paling kritis — mengubah cart menjadi order yang resmi.

```
Customer → POST /v1/orders
         Body: { shippingAddress, discountCode? }

Sistem (atomic transaction):
  1. Ambil Cart aktif customer
  2. Validasi cart tidak kosong
  3. Validasi stok tersedia untuk semua item
  4. Jika ada discountCode → validasi & hitung diskon
  5. Buat Order (status: PENDING_PAYMENT)
     - Snapshot harga produk saat ini ke OrderItem
     - Hitung total amount
  6. Reserve stok di Inventory (reserved += qty per item)
  7. Kosongkan Cart
  ← Order berhasil dibuat (orderId, totalAmount, status)
```

> **Penting:** Harga di `OrderItem` adalah **snapshot** harga saat checkout, bukan harga live dari produk. Ini memastikan konsistensi jika admin mengubah harga produk di kemudian hari.

**UC-O2: Lihat Daftar Order Saya**
```
Customer → GET /v1/orders?status=&page=&limit=
         ← List order milik customer (paginasi)
```

**UC-O3: Lihat Detail Order**
```
Customer → GET /v1/orders/{id}
         ← Detail order: items, total, status, payment info
```

**UC-O4: Update Status Order (Admin)**
```
Admin → PATCH /v1/orders/{id}
      Body: { status }
      
Transisi status yang valid (Admin):
  PAID → FULFILLMENT  (sedang diproses/dikirim)
  FULFILLMENT → COMPLETED  (order selesai)
  PENDING_PAYMENT → CANCELLED  (batalkan order)
```

---

### 3.5 Order Status Lifecycle

```
                    ┌─────────────────── (expired / cancel) ───────────────────┐
                    │                                                           ▼
[DRAFT] ──► [PENDING_PAYMENT] ──► [PAID] ──► [FULFILLMENT] ──► [COMPLETED]  [CANCELLED]
                    │                                                           ▲
                    └──────────── (webhook: CANCEL/EXPIRE/DENY) ───────────────┘
```

| Status | Trigger | Keterangan |
|---|---|---|
| `PENDING_PAYMENT` | Customer checkout | Order dibuat, menunggu pembayaran |
| `PAID` | Midtrans webhook `settlement` | Pembayaran dikonfirmasi |
| `FULFILLMENT` | Admin update | Pesanan sedang diproses / dikirim |
| `COMPLETED` | Admin update | Pesanan selesai diterima customer |
| `CANCELLED` | Webhook cancel/expire/deny atau Admin | Order dibatalkan, stok dibebaskan |

---

### 3.6 Payment — Midtrans Snap (Customer)

**UC-PAY1: Buat Pembayaran (Snap Token)**

```
Customer → POST /v1/payments/midtrans/snap
         Body: { orderId }

Sistem:
  1. Cek Order milik customer & status PENDING_PAYMENT
  2. Cek belum ada Payment INITIATED/PENDING untuk order ini
  3. Buat Payment record (status: INITIATED)
  4. Panggil Midtrans API → buat transaksi dengan:
     - order_id (unik, = Payment.providerRef)
     - gross_amount
     - item_details
     - customer_details
  5. Terima snap_token dari Midtrans
  ← { snapToken, redirectUrl }

Customer → Redirect ke Midtrans Snap UI → Pilih metode bayar → Bayar
```

**UC-PAY2: Webhook Handler (System — Midtrans)**

```
Midtrans → POST /v1/payments/midtrans/webhook
         Body: { order_id, transaction_status, fraud_status, signature_key, ... }

Sistem (idempotent):
  1. Verifikasi signature_key (SHA512 hash)
  2. Cari Payment by providerRef (order_id)
  3. Simpan raw webhook payload untuk audit
  4. Map transaction_status → PaymentStatus:
     - settlement / capture → SETTLEMENT
     - pending → PENDING
     - cancel → CANCEL
     - expire → EXPIRE
     - deny → DENY
     - refund → REFUND
  5. Update Payment.status
  6. Side effects berdasarkan status:
     - SETTLEMENT → Order.status = PAID, release reserved stock → kurangi stock aktual
     - CANCEL/EXPIRE/DENY → Order.status = CANCELLED, release reserved stock (kembalikan)
  ← 200 OK
```

**UC-PAY3: Lihat Detail Payment**
```
Customer/Admin → GET /v1/payments/{id}
              ← Detail payment: amount, status, provider, providerRef, timestamps
```

---

### 3.7 Payment Status Lifecycle

```
              ┌──── CANCEL / EXPIRE / DENY ────┐
              │                                ▼
[INITIATED] ──► [PENDING] ──► [SETTLEMENT]  [CANCEL]
                    │                        [EXPIRE]
                    └──────── REFUND ──►     [DENY]
                                          [REFUND]
                                          [FAILED]
```

| Status | Keterangan |
|---|---|
| `INITIATED` | Payment record dibuat, snap token di-generate |
| `PENDING` | Customer membuka halaman bayar Midtrans |
| `SETTLEMENT` | Pembayaran berhasil dikonfirmasi |
| `CANCEL` | Customer/sistem membatalkan transaksi |
| `EXPIRE` | Waktu pembayaran habis |
| `DENY` | Pembayaran ditolak (fraud / kartu ditolak) |
| `REFUND` | Transaksi di-refund |
| `FAILED` | Error pada sisi payment gateway |

---

### 3.8 Discount / Voucher (Customer + Admin)

**UC-D1: Admin Buat Diskon**
```
Admin → POST /v1/discounts
      Body: {
        code,         // unik, mis. "KERAMIK10"
        name,
        type,         // PERCENTAGE | FIXED_AMOUNT
        value,        // 10 (= 10%) atau 50000 (= Rp 50.000)
        applicability,// ALL_PRODUCTS | SPECIFIC_PRODUCTS | MINIMUM_PURCHASE
        startDate,
        endDate,
        usageLimit?   // max pemakaian total
      }
```

**UC-D2: Validasi Kode Diskon**
```
Customer → POST /v1/discounts/validate
         Body: { code, cartTotal }

Sistem:
  1. Cek diskon exist & status ACTIVE
  2. Cek belum expired (startDate <= now <= endDate)
  3. Cek usage limit belum tercapai
  4. Cek applicability (minimum purchase, produk spesifik, dll)
  ← { valid: true, discountAmount, finalTotal }
  atau ← { valid: false, reason }
```

**UC-D3: Apply Diskon saat Checkout**
```
Customer → POST /v1/orders
         Body: { ..., discountCode: "KERAMIK10" }

Sistem:
  1. Jalankan UC-D2 (validasi)
  2. Hitung discountAmount
  3. finalAmount = totalAmount - discountAmount
  4. Increment discount.usageCount
  5. Catat diskon yang digunakan di Order
```

**UC-D4: Admin Kelola Diskon**
```
Admin → GET /v1/discounts?status=&type=&page=  (list)
Admin → GET /v1/discounts/{id}                 (detail)
Admin → PATCH /v1/discounts/{id}               (update)
Admin → DELETE /v1/discounts/{id}              (hapus)
```

---

## 4. End-to-End Happy Path: Customer Checkout

Berikut adalah alur lengkap dari browsing sampai pembayaran berhasil:

```
1. [BROWSE]
   Customer → GET /v1/products?search=30x30+anti-slip
   Customer → GET /v1/products/{id}          ← lihat detail
   Customer → GET /v1/inventory/{productId}  ← cek stok

2. [CART]
   Customer → POST /v1/cart/items   { productId, quantity: 2 }
   Customer → POST /v1/cart/items   { productId2, quantity: 1 }
   Customer → GET  /v1/cart         ← review cart

3. [DISCOUNT] (opsional)
   Customer → POST /v1/discounts/validate  { code: "KERAMIK10", cartTotal }

4. [CHECKOUT]
   Customer → POST /v1/orders  { shippingAddress, discountCode? }
   ← { orderId, totalAmount, status: "PENDING_PAYMENT" }

5. [PAYMENT]
   Customer → POST /v1/payments/midtrans/snap  { orderId }
   ← { snapToken }
   Customer → [redirect ke Midtrans Snap UI]
   Customer → Pilih metode bayar & selesaikan pembayaran

6. [WEBHOOK — otomatis]
   Midtrans → POST /v1/payments/midtrans/webhook
   Sistem   → verifikasi signature
   Sistem   → update Payment.status = SETTLEMENT
   Sistem   → update Order.status   = PAID
   Sistem   → kurangi Inventory.stock (commit reserved)

7. [KONFIRMASI]
   Customer → GET /v1/orders/{id}
   ← { status: "PAID", payment: { status: "SETTLEMENT" } }
```

---

## 5. Edge Cases & Error Scenarios

### Stok Habis
```
Customer → POST /v1/cart/items  { productId, quantity: 10 }
Stok available = 3
← 400 Bad Request: "Insufficient stock"
```

### Payment Expired
```
Customer tidak menyelesaikan pembayaran dalam batas waktu Midtrans
Midtrans → POST /v1/payments/midtrans/webhook  { transaction_status: "expire" }
Sistem   → Payment.status = EXPIRE
Sistem   → Order.status   = CANCELLED
Sistem   → Release reserved stock (kembalikan ke available)
```

### Webhook Duplicate (Idempotency)
```
Midtrans mengirim webhook yang sama 2x
Sistem → Cek Payment sudah di-update → skip update, return 200 OK
```

### Checkout Cart Kosong
```
Customer → POST /v1/orders  (cart kosong)
← 400 Bad Request: "Cart is empty"
```

---

## 6. Inventory: Konsep Reserved Stock

Untuk mencegah overselling, inventory menggunakan konsep **reserved stock**:

```
totalStock = actualStock + reservedStock + availableStock

saat AddToCart / Checkout:
  availableStock -= quantity
  reservedStock  += quantity

saat Order PAID (webhook settlement):
  reservedStock  -= quantity
  (stok fisik berkurang)

saat Order CANCELLED (webhook cancel/expire/deny):
  reservedStock  -= quantity
  availableStock += quantity   ← stok dikembalikan
```

---

## 7. API Endpoint Summary (E-Commerce Only)

### Products
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/v1/products` | Public | List produk dengan filter |
| `POST` | `/v1/products` | Admin | Buat produk baru |
| `GET` | `/v1/products/{id}` | Public | Detail produk |
| `PATCH` | `/v1/products/{id}` | Admin | Update produk |
| `DELETE` | `/v1/products/{id}` | Admin | Hapus produk |

### Inventory
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/v1/inventory/{productId}` | Customer | Cek stok produk |
| `PATCH` | `/v1/inventory/{productId}` | Admin | Adjust stok |

### Cart
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/v1/cart` | Customer | Lihat cart aktif |
| `POST` | `/v1/cart/items` | Customer | Tambah item |
| `PATCH` | `/v1/cart/items/{itemId}` | Customer | Update quantity |
| `DELETE` | `/v1/cart/items/{itemId}` | Customer | Hapus item |
| `DELETE` | `/v1/cart/clear` | Customer | Kosongkan cart |

### Orders
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/v1/orders` | Customer | List order saya |
| `POST` | `/v1/orders` | Customer | Checkout (buat order) |
| `GET` | `/v1/orders/{id}` | Customer | Detail order |
| `PATCH` | `/v1/orders/{id}` | Admin | Update status order |

### Payments
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/v1/payments/midtrans/snap` | Customer | Generate snap token |
| `POST` | `/v1/payments/midtrans/webhook` | Public* | Callback Midtrans |
| `GET` | `/v1/payments/{id}` | Customer | Detail payment |

> *Webhook diproteksi dengan signature verification, bukan JWT.

### Discounts
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/v1/discounts` | Admin | List diskon |
| `POST` | `/v1/discounts` | Admin | Buat diskon |
| `POST` | `/v1/discounts/validate` | Customer | Validasi kode diskon |
| `GET` | `/v1/discounts/{id}` | Admin | Detail diskon |
| `PATCH` | `/v1/discounts/{id}` | Admin | Update diskon |
| `DELETE` | `/v1/discounts/{id}` | Admin | Hapus diskon |
