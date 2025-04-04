-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Seed categories
INSERT INTO categories (name, description) VALUES
('Textbooks', 'Academic textbooks and study materials'),
('Electronics', 'Computers, phones, and electronics'),
('Furniture', 'Dorm and apartment furniture'),
('Clothing', 'Clothing and accessories'),
('Sports & Fitness', 'Sports equipment and fitness gear'),
('Tickets', 'Event tickets and passes'),
('Services', 'Tutoring, rides, and other services'),
('Other', 'Miscellaneous items')
ON CONFLICT (name) DO NOTHING; 