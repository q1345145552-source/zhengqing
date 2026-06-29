-- 004_add_review_fields.sql
-- 员工审核相关字段

-- submissions 表新增审核状态等字段
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review_comment TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS next_account VARCHAR(100);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS next_register_status VARCHAR(20);

-- 更新已有数据：status='submitted' 的改为 review_status='pending'
UPDATE submissions SET review_status = 'pending' WHERE status = 'submitted' AND review_status = 'pending';
