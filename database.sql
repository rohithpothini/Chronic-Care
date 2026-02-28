-- Create database
CREATE DATABASE IF NOT EXISTS chronic_care_db;

USE chronic_care_db;

-- Create patient health table
CREATE TABLE IF NOT EXISTS patient_health (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INT,
  weight FLOAT,
  glucose FLOAT,
  bp_systolic FLOAT,
  bp_diastolic FLOAT,
  heart_rate INT,
  cholesterol FLOAT,
  risk_score FLOAT,
  message VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_created_at (created_at)
);

-- Optional: Insert sample data
-- INSERT INTO patient_health (name, age, weight, glucose, bp_systolic, bp_diastolic, heart_rate, cholesterol, risk_score, message)
-- VALUES ('John Doe', 45, 75, 120, 130, 85, 75, 200, 0.45, 'Low Risk');
