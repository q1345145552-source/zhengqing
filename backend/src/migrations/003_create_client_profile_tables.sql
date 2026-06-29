-- 正清系统 - 客户资料表
-- 003_create_client_profile_tables.sql

-- 客户公司资料表（可重复使用）
CREATE TABLE IF NOT EXISTS client_company_docs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200),
    thai_address TEXT,
    dbd_file JSONB DEFAULT '{}',
    pp20_file JSONB DEFAULT '{}',
    company_stamp_file JSONB DEFAULT '{}',
    director_passport_file JSONB DEFAULT '{}',
    legal_rep_info JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_company_docs_user_id ON client_company_docs(user_id);

-- 客户报关授权表（可重复使用）
CREATE TABLE IF NOT EXISTS client_customs_auths (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auth_type VARCHAR(20) DEFAULT 'director' CHECK (auth_type IN ('director', 'agent')),
    account_number VARCHAR(100),
    password VARCHAR(255),
    power_of_attorney_file JSONB DEFAULT '{}',
    pp20_signed_file JSONB DEFAULT '{}',
    dbd_signed_file JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_customs_auths_user_id ON client_customs_auths(user_id);
