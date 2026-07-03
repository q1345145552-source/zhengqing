-- 009_add_license_docs.sql
-- 许可证上传相关功能

-- 给 submissions 表添加 license_type 列
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS license_type VARCHAR(20);

-- 许可证文件表
CREATE TABLE IF NOT EXISTS submission_license_docs (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    license_type VARCHAR(20) NOT NULL CHECK (license_type IN ('FDA', 'TISI', 'NBTC')),
    file_name VARCHAR(500),
    file_path VARCHAR(500),
    url VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_license_docs_submission_id ON submission_license_docs(submission_id);
