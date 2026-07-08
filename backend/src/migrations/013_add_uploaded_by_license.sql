-- 013_add_uploaded_by_license.sql
ALTER TABLE submission_license_docs ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(20) DEFAULT '客户';
