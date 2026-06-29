-- 正清系统 - 资料上传相关表
-- 002_create_submission_tables.sql

-- 主表：提交流程进度
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 阶段1：产品确认
CREATE TABLE IF NOT EXISTS submission_products (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    product_images JSONB DEFAULT '[]',
    thai_name VARCHAR(200),
    english_name VARCHAR(200),
    license_required BOOLEAN,
    import_eligible BOOLEAN,
    tariff_rate VARCHAR(50),
    form_e_eligible BOOLEAN,
    hs_code VARCHAR(50),
    license_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 阶段2：公司资料
CREATE TABLE IF NOT EXISTS submission_company_docs (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    dbd_file JSONB DEFAULT '{}',
    pp20_file JSONB DEFAULT '{}',
    company_stamp_file JSONB DEFAULT '{}',
    director_passport_file JSONB DEFAULT '{}',
    thai_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 阶段3：报关授权
CREATE TABLE IF NOT EXISTS submission_customs_auth (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    handler_type VARCHAR(20) DEFAULT 'director' CHECK (handler_type IN ('director', 'agent')),
    power_of_attorney_file JSONB DEFAULT '{}',
    pp20_signed_file JSONB DEFAULT '{}',
    dbd_signed_file JSONB DEFAULT '{}',
    has_director_passport_original BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 阶段4：出口退税
CREATE TABLE IF NOT EXISTS submission_tax_rebate (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    need_rebate BOOLEAN DEFAULT false,
    customs_company_name VARCHAR(200),
    logistics_contact VARCHAR(200),
    logistics_code VARCHAR(100),
    invoice_file JSONB DEFAULT '{}',
    packing_list_file JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 阶段5：发货入仓
CREATE TABLE IF NOT EXISTS submission_shipments (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    confirmed BOOLEAN DEFAULT false,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE IF NOT EXISTS submission_files (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 5),
    original_name VARCHAR(255),
    stored_path VARCHAR(500),
    mime_type VARCHAR(100),
    size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_submission_files_submission_id ON submission_files(submission_id);
