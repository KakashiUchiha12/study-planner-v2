-- Study Planner Database Schema
-- Run this in phpMyAdmin to create your database structure

-- Create database (if not exists)
-- CREATE DATABASE IF NOT EXISTS study_planner_db;
-- USE study_planner_db;

-- Users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    subject_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- Study sessions table
CREATE TABLE study_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    subject_id VARCHAR(255),
    duration_minutes INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- Study goals table
CREATE TABLE study_goals (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    subject_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    target_hours INT NOT NULL,
    current_hours INT DEFAULT 0,
    deadline DATE,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_subject_id ON tasks(subject_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_goals_user_id ON study_goals(user_id);

-- Insert sample data for testing
INSERT INTO users (id, name, email, password_hash, image) VALUES 
('1', 'Demo User', 'demo@studyplanner.com', '$2a$10$demo.hash.for.testing', '/placeholder-user.jpg');

INSERT INTO subjects (id, user_id, name, color, description) VALUES 
('1', '1', 'Mathematics', '#EF4444', 'Advanced calculus and algebra'),
('2', '1', 'Physics', '#10B981', 'Classical mechanics and thermodynamics'),
('3', '1', 'Computer Science', '#3B82F6', 'Programming and algorithms');

INSERT INTO tasks (id, user_id, subject_id, title, description, priority, status, due_date) VALUES 
('1', '1', '1', 'Complete Calculus Assignment', 'Finish problems 1-20 in Chapter 3', 'high', 'pending', DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
('2', '1', '2', 'Physics Lab Report', 'Write report on pendulum experiment', 'medium', 'in_progress', DATE_ADD(CURDATE(), INTERVAL 1 WEEK)),
('3', '1', '3', 'Code Review', 'Review team member\'s pull request', 'low', 'completed', CURDATE());
