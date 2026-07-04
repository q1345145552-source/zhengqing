-- ============================================================
-- 正确价格数据 (手动执行，不会自动运行)
-- 执行方式: psql -U postgres -d zhengqing -f seed_prices.sql
-- ============================================================

-- 南宁到曼谷
UPDATE price_rules SET unit_price = 3400 WHERE fee_type = 'freight_cbm_small' AND route = 'nanning_bangkok';
UPDATE price_rules SET unit_price = 3000 WHERE fee_type = 'freight_cbm_large' AND route = 'nanning_bangkok';
UPDATE price_rules SET unit_price = 20   WHERE fee_type = 'freight_kg'        AND route = 'nanning_bangkok';

-- 广州深圳到曼谷
UPDATE price_rules SET unit_price = 4000 WHERE fee_type = 'freight_cbm_small' AND route = 'guangzhou_bangkok';
UPDATE price_rules SET unit_price = 3400 WHERE fee_type = 'freight_cbm_large' AND route = 'guangzhou_bangkok';
UPDATE price_rules SET unit_price = 22   WHERE fee_type = 'freight_kg'        AND route = 'guangzhou_bangkok';

-- 义乌到曼谷
UPDATE price_rules SET unit_price = 5000 WHERE fee_type = 'freight_cbm_small' AND route = 'yiwu_bangkok';
UPDATE price_rules SET unit_price = 4000 WHERE fee_type = 'freight_cbm_large' AND route = 'yiwu_bangkok';
UPDATE price_rules SET unit_price = 24   WHERE fee_type = 'freight_kg'        AND route = 'yiwu_bangkok';

-- 附加服务
UPDATE price_rules SET unit_price = 4000 WHERE fee_type = 'form_e';          -- Form E 产地证
UPDATE price_rules SET unit_price = 4000 WHERE fee_type = 'china_customs';  -- 中国报关费
UPDATE price_rules SET unit_price = 3500 WHERE fee_type = 'thai_customs';   -- 泰国清关费
UPDATE price_rules SET unit_price = 1800 WHERE fee_type = 'pallet';         -- 托盘费
UPDATE price_rules SET unit_price = 2500 WHERE fee_type = 'wooden_box';     -- 木箱包装费
