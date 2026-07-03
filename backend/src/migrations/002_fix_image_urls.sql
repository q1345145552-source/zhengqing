-- 修复图片 URL 路径不一致问题
-- 根因：multer 处理 FormData 时先存文件（stage 默认为 '0'），
-- 后读取 body（stage='1'），导致 URL 和实际存储路径差一位

-- 1. 从 stored_path 反推正确的 url
UPDATE submission_files 
SET url = REPLACE(stored_path, '/app/backend', '')
WHERE url != REPLACE(stored_path, '/app/backend', '');

-- 2. 放宽 stage 约束，允许 0（与 multer 默认值一致）
ALTER TABLE submission_files DROP CONSTRAINT IF EXISTS submission_files_stage_check;
ALTER TABLE submission_files ADD CONSTRAINT submission_files_stage_check CHECK (stage >= 0 AND stage <= 5);
