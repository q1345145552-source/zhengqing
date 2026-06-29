-- First make route_name nullable since code uses 'route' column
ALTER TABLE price_rules ALTER COLUMN route_name DROP NOT NULL;

-- 路线运费
INSERT INTO price_rules (fee_type, fee_name, unit, unit_price, route, is_active, description) VALUES
('freight_cbm_small', '小体积运费 (≤5m³)', 'per_cbm', 2800, 'nanning_bangkok', true, '体积≤5m³按此单价'),
('freight_cbm_large', '大体积运费 (>5m³)', 'per_cbm', 2200, 'nanning_bangkok', true, '体积>5m³按此单价'),
('freight_kg', '重量运费', 'per_kg', 12, 'nanning_bangkok', true, '按重量计费'),
('freight_cbm_small', '小体积运费 (≤5m³)', 'per_cbm', 2500, 'guangzhou_bangkok', true, '体积≤5m³按此单价'),
('freight_cbm_large', '大体积运费 (>5m³)', 'per_cbm', 2000, 'guangzhou_bangkok', true, '体积>5m³按此单价'),
('freight_kg', '重量运费', 'per_kg', 10, 'guangzhou_bangkok', true, '按重量计费'),
('freight_cbm_small', '小体积运费 (≤5m³)', 'per_cbm', 3200, 'yiwu_bangkok', true, '体积≤5m³按此单价'),
('freight_cbm_large', '大体积运费 (>5m³)', 'per_cbm', 2600, 'yiwu_bangkok', true, '体积>5m³按此单价'),
('freight_kg', '重量运费', 'per_kg', 14, 'yiwu_bangkok', true, '按重量计费');

-- 附加服务
INSERT INTO price_rules (fee_type, fee_name, unit, unit_price, is_active, description) VALUES
('form_e', 'Form E 产地证', 'per_order', 1500, true, '每单'),
('china_customs', '中国报关费', 'per_order', 800, true, '每单'),
('thai_customs', '泰国清关费', 'per_order', 2500, true, '每单'),
('pallet', '托盘费', 'per_pallet', 500, true, '每托'),
('wooden_box', '木箱包装费', 'per_cbm', 1800, true, '按立方米，最低1000泰铢'),
('domestic_bluewhite', 'BlueWhite 蓝白物流', 'per_order', 500, true, '境内派送'),
('domestic_flash', 'Flash Express', 'per_order', 350, true, '境内派送'),
('domestic_kerry', 'Kerry Express', 'per_order', 400, true, '境内派送'),
('domestic_nim', 'Nim Express', 'per_order', 450, true, '境内派送');
