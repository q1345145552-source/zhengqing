-- 005_add_tracking_status.sql
-- 订单物流状态追踪

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tracking_status INTEGER DEFAULT 1 CHECK (tracking_status BETWEEN 1 AND 11);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tracking_status_updated_at TIMESTAMP;

COMMENT ON COLUMN submissions.tracking_status IS '订单状态: 1待审核 2审核通过 3待付款 4已付款 5仓库收货中 6运输中 7已到泰国仓库 8清关中 9已放行 10已派送 11已完成';
