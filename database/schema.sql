-- ==================== USUARIOS ====================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INVENTARIO ====================
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 0,
  max_quantity INTEGER DEFAULT 999,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_name)
);

-- ==================== MOEDAS ====================
CREATE TABLE wallet (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  virtual_coins DECIMAL(15,2) DEFAULT 0,
  real_money DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== MATERIAS PRIMAS ====================
CREATE TABLE raw_materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  rarity VARCHAR(20) NOT NULL, -- common, uncommon, rare, epic, legendary
  source VARCHAR(50) NOT NULL, -- farming, mining, hunting, crafting
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== RECEITAS ====================
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- weapon, armor, tool, consumable
  output_quantity INTEGER DEFAULT 1,
  crafting_time INTEGER NOT NULL, -- segundos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INGREDIENTES RECEITA ====================
CREATE TABLE recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_required INTEGER NOT NULL,
  UNIQUE(recipe_id, material_id)
);

-- ==================== ARMAS ====================
CREATE TABLE weapons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  damage INTEGER NOT NULL,
  durability INTEGER NOT NULL,
  recipe_id INTEGER REFERENCES recipes(id),
  rarity VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== MONSTROS ====================
CREATE TABLE monsters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  health INTEGER NOT NULL,
  damage INTEGER NOT NULL,
  experience_reward INTEGER NOT NULL,
  drops JSONB, -- {item_name: chance_percentage}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== MERCADO ====================
CREATE TABLE market_listings (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- ==================== TRANSACOES ====================
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- market_buy, direct_trade, crafting, monster_drop
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CONVERSAO REAL MONEY ====================
CREATE TABLE real_money_conversions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  virtual_coins DECIMAL(15,2) NOT NULL,
  real_money_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- pending, approved, rejected, completed
  payment_method VARCHAR(50), -- stripe, paypal, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ==================== INDICES ====================
CREATE INDEX idx_user_id ON inventory(user_id);
CREATE INDEX idx_seller_id ON market_listings(seller_id);
CREATE INDEX idx_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_seller_id_trans ON transactions(seller_id);
CREATE INDEX idx_user_id_conversion ON real_money_conversions(user_id);