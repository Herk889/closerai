-- CloserAI Database Schema

-- Config du bot (produit, ton, objections, etc.)
CREATE TABLE bot_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name TEXT NOT NULL DEFAULT 'Mon Business',
    product_name TEXT NOT NULL DEFAULT 'Mon Produit',
    product_description TEXT NOT NULL DEFAULT '',
    product_price TEXT NOT NULL DEFAULT '0',
    currency TEXT NOT NULL DEFAULT 'EUR',
    tone TEXT NOT NULL DEFAULT 'professionnel mais amical',
    language TEXT NOT NULL DEFAULT 'fr',
    faq JSONB DEFAULT '[]'::jsonb,
    objections JSONB DEFAULT '[]'::jsonb,
    payment_link TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

-- Conversations
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wa_contact_id TEXT NOT NULL,
    contact_name TEXT DEFAULT 'Inconnu',
    contact_phone TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'qualified', 'converted', 'lost', 'stale')),
    lead_score INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    messages_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- Messages individuels
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- Stats agregees (pour le dashboard)
CREATE TABLE daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    conversations_started INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    leads_qualified INTEGER DEFAULT 0,
    leads_converted INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    UNIQUE(date)
  );

-- Index pour les perfs
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- Insert une config par defaut
INSERT INTO bot_config (business_name, product_name, product_description, product_price, tone, language)
VALUES ('CloserAI Demo', 'Coaching Business', 'Programme de coaching personnalise pour entrepreneurs qui veulent scaler leur business de 0 a 10K/mois', '997', 'amical, direct, motivant', 'fr');
