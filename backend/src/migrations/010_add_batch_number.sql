-- 010_add_batch_number.sql
-- 批次号 + 仓库地址拆分

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address_prev TEXT;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address_next TEXT;

-- 拆分现有仓库地址：取前一半作为 address_prev，后一半作为 address_next
-- 以"区""镇""乡""街道"之后为分界点
UPDATE warehouses
SET
  address_prev = CASE
    WHEN address IS NULL THEN NULL
    -- 取最后一个 "区" / "镇" / "乡" / "街道" 位置，之前为 address_prev
    WHEN position('区' IN reverse(address)) > 0 THEN left(address, length(address) - position('区' IN reverse(address)))
    WHEN position('镇' IN reverse(address)) > 0 THEN left(address, length(address) - position('镇' IN reverse(address)))
    WHEN position('乡' IN reverse(address)) > 0 THEN left(address, length(address) - position('乡' IN reverse(address)))
    WHEN position('街道' IN reverse(address)) > 0 THEN left(address, length(address) - position('街道' IN reverse(address)))
    ELSE left(address, greatest(1, length(address) / 2))
  END,
  address_next = CASE
    WHEN address IS NULL THEN NULL
    WHEN position('区' IN reverse(address)) > 0 THEN substring(address FROM length(address) - position('区' IN reverse(address)) + 1)
    WHEN position('镇' IN reverse(address)) > 0 THEN substring(address FROM length(address) - position('镇' IN reverse(address)) + 1)
    WHEN position('乡' IN reverse(address)) > 0 THEN substring(address FROM length(address) - position('乡' IN reverse(address)) + 1)
    WHEN position('街道' IN reverse(address)) > 0 THEN substring(address FROM length(address) - position('街道' IN reverse(address)) + 1)
    ELSE substring(address FROM greatest(1, length(address) / 2 + 1))
  END
WHERE address IS NOT NULL AND address != '';
