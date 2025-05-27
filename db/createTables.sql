-- createTables.sql
CREATE TABLE IF NOT EXISTS donationCampaign (
    id SERIAL PRIMARY KEY,
    featured_image_base_url VARCHAR(255),
    featured_image_path VARCHAR(255),
    temple_name VARCHAR(100),
    campaign_name VARCHAR(255),
    description TEXT,
    short_name VARCHAR(255),
    short_description TEXT,
    location VARCHAR(255),
    event VARCHAR(255),
    priority INTEGER,
    target_amount DECIMAL(10, 2),
    donated_amount DECIMAL(10, 2) DEFAULT 0.00,
    start_date DATE,
    expiry_date TIMESTAMP,
    is_published BOOLEAN,
    is_expired BOOLEAN,
    tax_beneficiary BOOLEAN,
    billing_address BOOLEAN,
    about TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    slug VARCHAR(255) UNIQUE,  -- Add UNIQUE constraint here
    row_pre_id VARCHAR(10),
    is_anonymous BOOLEAN,
    is_whatsapp_update BOOLEAN,
    minimum_amount DECIMAL(10, 2),
    banner_image_id INTEGER
);

CREATE TABLE IF NOT EXISTS subdonations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    featured_image VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    campaign_slug VARCHAR(255) REFERENCES donationCampaign(slug)
);


CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    donated_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10, 2) NOT NULL,
    donation_campaign_id INTEGER REFERENCES donationCampaign(id)
);


CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile_number VARCHAR(20) UNIQUE,
    address TEXT,
    profile_pic VARCHAR(255),
    transactions INTEGER REFERENCES donations(id),  -- Assuming donations table has an 'id' column
    otp VARCHAR(10)  -- OTP field for verification
);
