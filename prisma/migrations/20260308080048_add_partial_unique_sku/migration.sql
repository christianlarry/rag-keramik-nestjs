-- 1. Hapus index unik yang lama (Sesuaikan namanya, biasanya "Table_column_key")
DROP INDEX IF EXISTS "Product_sku_key";

-- 2. Buat index parsial yang baru
CREATE UNIQUE INDEX "idx_unique_sku_active" 
ON "Product" ("sku") 
WHERE "deletedAt" IS NULL;