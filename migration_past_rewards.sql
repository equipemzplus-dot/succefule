-- Table for payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for past monthly rewards
CREATE TABLE IF NOT EXISTS past_monthly_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year TEXT NOT NULL, 
  rank INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  country_code TEXT,
  amount_fcfa INTEGER NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Payment Methods
INSERT INTO payment_methods (name, logo_url) VALUES 
('Orange Money', 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg'),
('MTN Mobile Money', 'https://upload.wikimedia.org/wikipedia/commons/9/93/MTN_Logo.svg'),
('Wave', 'https://play-lh.googleusercontent.com/1-TtcB5K-8g8T9Ym-o9D52p7D0uEqg399o2kLrdLzOwe39mGE2u_nKj-r4I1h9q1Xw'),
('PayPal', 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg')
ON CONFLICT (name) DO NOTHING;
