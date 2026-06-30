-- 006_add_performance_indexes.sql
-- 性能优化：为常用查询字段添加数据库索引

-- ==================== submissions 表 ====================
-- tracking_status 用于货物追踪查询（高频查询字段）
CREATE INDEX IF NOT EXISTS idx_submissions_tracking_status ON submissions(tracking_status);

-- created_at 用于排序和日期范围过滤
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- review_status 用于审核列表过滤
CREATE INDEX IF NOT EXISTS idx_submissions_review_status ON submissions(review_status);

-- 复合索引：用户ID + 状态（替代单字段 idx_submissions_user_id，覆盖更多查询）
-- 客户端"我的申请"列表最常用的查询模式
CREATE INDEX IF NOT EXISTS idx_submissions_user_id_status ON submissions(user_id, status);

-- application_no 用于申请编号搜索
CREATE INDEX IF NOT EXISTS idx_submissions_application_no ON submissions(application_no);

-- 复合索引：状态 + 审核状态（员工/管理员审核列表常用组合）
CREATE INDEX IF NOT EXISTS idx_submissions_status_review ON submissions(status, review_status);

-- 复合索引：用户ID + 状态 + tracking_status（客户端追踪列表）
CREATE INDEX IF NOT EXISTS idx_submissions_user_tracking ON submissions(user_id, status, tracking_status);

-- ==================== price_rules 表 ====================
-- route 用于按路线筛选价格
CREATE INDEX IF NOT EXISTS idx_price_rules_route ON price_rules(route);

-- fee_type 用于按费用类型查找
CREATE INDEX IF NOT EXISTS idx_price_rules_fee_type ON price_rules(fee_type);

-- 复合索引：route + fee_type（最常用的价格查询模式）
CREATE INDEX IF NOT EXISTS idx_price_rules_route_type ON price_rules(route, fee_type);

-- ==================== wallet_transactions 表 ====================
-- 用户钱包交易历史查询
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);

-- ==================== notifications 表 ====================
-- 用户通知查询
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 未读通知计数
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- ==================== review_logs 表 ====================
-- 按提交ID查审核日志
CREATE INDEX IF NOT EXISTS idx_review_logs_submission_id ON review_logs(submission_id);

-- 按员工ID查操作记录
CREATE INDEX IF NOT EXISTS idx_review_logs_employee_id ON review_logs(employee_id);

-- ==================== submission_charges 表 ====================
-- 按提交ID查费用
CREATE INDEX IF NOT EXISTS idx_submission_charges_submission_id ON submission_charges(submission_id);

-- ==================== submission_charge_logs 表 ====================
-- 按提交ID查扣款日志
CREATE INDEX IF NOT EXISTS idx_charge_logs_submission_id ON submission_charge_logs(submission_id);

-- ==================== client_wallets 表 ====================
-- 用户钱包查询
CREATE INDEX IF NOT EXISTS idx_client_wallets_user_id ON client_wallets(user_id);
