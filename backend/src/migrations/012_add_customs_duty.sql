-- 012_add_customs_duty.sql
-- 海关关税：代垫费用，实报实销，员工根据 Next 账单填写

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS customs_duty_amount DECIMAL(12,2) DEFAULT 0;

-- 价格规则表新增海关关税条目（仅作记录参考，金额为0，实际由员工填写）
INSERT INTO price_rules (fee_type, fee_name, unit_price, is_active)
VALUES ('customs_duty', '海关关税', 0, true)
ON CONFLICT (fee_type) DO NOTHING;
