-- Create checkout_dashboard table for checkout dashboard authentication
CREATE TABLE IF NOT EXISTS checkout_dashboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a sample user for testing (password: password123)
-- Note: You should change this password after testing
INSERT INTO checkout_dashboard (email, password, name) VALUES
('test@example.com', '$2a$10$rQ5Z5p5Z5p5Z5p5Z5p5Z5uK5Z5p5Z5p5Z5p5Z5p5Z5p5Z5p5Z5p5Z', 'Test User')
ON DUPLICATE KEY UPDATE email=email;
