-- =====================================================
-- SCHOOL ENTRANCE MONITORING SYSTEM
-- DATABASE SCHEMA & SEED DATA
-- =====================================================

DROP DATABASE IF EXISTS student_gate_monitoring_db;

CREATE DATABASE student_gate_monitoring_db
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE student_gate_monitoring_db;

-- =====================================================
-- ENTITY 1: USERS (System User Accounts: Admin & Guard)
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50) DEFAULT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'guard') NOT NULL DEFAULT 'admin',
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ENTITY 2: GRADE LEVELS
-- =====================================================
CREATE TABLE grade_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_name VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ENTITY 3: SECTIONS
-- =====================================================
CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_level_id INT NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    CONSTRAINT fk_sections_grade_level
        FOREIGN KEY (grade_level_id)
        REFERENCES grade_levels(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ENTITY 4: STUDENTS
-- =====================================================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id_number VARCHAR(30) NOT NULL UNIQUE, -- Student ID (e.g. STU-109283746501)
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50) DEFAULT NULL,
    last_name VARCHAR(50) NOT NULL,
    photo LONGTEXT DEFAULT NULL,
    section_id INT NOT NULL,
    created_by_user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_section
        FOREIGN KEY (section_id)
        REFERENCES sections(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_students_user
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ENTITY 5: QR CODES
-- =====================================================
CREATE TABLE qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    qr_value VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qr_codes_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ASSOCIATIVE ENTITY: GATE LOGS (Scans / Time Events)
-- =====================================================
CREATE TABLE gate_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_id INT NOT NULL,
    scan_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ENTRY', 'EXIT') NOT NULL DEFAULT 'ENTRY',
    CONSTRAINT fk_gate_logs_qr
        FOREIGN KEY (qr_id)
        REFERENCES qr_codes(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED DATA
-- =====================================================

-- 1. USERS (Sample logins: admin/admin123 and guard/guard123)
INSERT INTO users (username, password, first_name, middle_name, last_name, role, active) VALUES
('admin', 'admin123', 'System', 'ICT', 'Administrator', 'admin', 1),
('guard', 'guard123', 'Gate', 'Security', 'Officer', 'guard', 1);

-- 2. GRADE LEVELS
INSERT INTO grade_levels (grade_name) VALUES
('Grade 7'), ('Grade 8'), ('Grade 9'), ('Grade 10'), ('Grade 11'), ('Grade 12');

-- 3. SECTIONS
INSERT INTO sections (grade_level_id, section_name) VALUES
(1, 'St. Lorenzo'), (1, 'St. Michael'), (1, 'St. Vincent'), (1, 'St. Raphael'),
(2, 'St. Barachel'), (2, 'St. Uriel'), (2, 'St. Sealtiel'), (2, 'St. Gabriel'),
(3, 'St. John'), (3, 'St. Paul'), (3, 'St. Anthony'), (3, 'St. James'),
(4, 'St. Matthew'), (4, 'St. Luke'), (4, 'St. Thomas'),
(5, 'GAS - Faithful'), (5, 'GAS - Loyalty'), (5, 'GAS - Patience'),
(6, 'GAS - Compassionate'), (6, 'GAS - Integrity');

-- 4. STUDENTS
INSERT INTO students (student_id_number, first_name, middle_name, last_name, photo, section_id, created_by_user_id) VALUES
('STU-109283746501', 'Steven', 'G.', 'Ochigue', 'steven.jpg', 1, 1),
('STU-109283746502', 'Kent Lloyd', 'M.', 'Valmores', 'kent.jpg', 16, 1),
('STU-109283746503', 'Christine Rose', 'A.', 'Pahis', 'christine.jpg', 9, 1),
('STU-109283746504', 'Darren', 'J.', 'Watkins', 'darren.jpg', 19, 1);

-- 5. QR CODES
INSERT INTO qr_codes (student_id, qr_value) VALUES
(1, 'STU-109283746501'),
(2, 'STU-109283746502'),
(3, 'STU-109283746503'),
(4, 'STU-109283746504');

-- 6. GATE LOGS
INSERT INTO gate_logs (qr_id, status) VALUES
(1, 'ENTRY'), (2, 'ENTRY'), (3, 'ENTRY'), (4, 'ENTRY');
