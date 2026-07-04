-- 011_add_forecast_fields.sql
-- 预报单字段：客户在第五步填写的物流预估数据

ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS route VARCHAR(50);
ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS volume DECIMAL(10,2);
ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2);
ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS domestic_logistics VARCHAR(50);
ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS need_form_e BOOLEAN DEFAULT false;
ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS need_china_customs BOOLEAN DEFAULT false;
ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS need_thai_customs BOOLEAN DEFAULT false;
ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS pallet_count INTEGER DEFAULT 0;
ALTER TABLE submission_shipments ADD COLUMN IF NOT EXISTS wooden_box_cbm DECIMAL(10,2) DEFAULT 0;
