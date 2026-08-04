-- =====================================================
-- STUDENT GATE MONITORING SYSTEM
-- DATABASE SCHEMA & SEED DATA
-- =====================================================

DROP DATABASE IF EXISTS student_gate_monitoring_db;

CREATE DATABASE student_gate_monitoring_db
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE student_gate_monitoring_db;

-- =====================================================
-- SYSTEM ADMINS
-- =====================================================

CREATE TABLE system_admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,
    email VARCHAR(100)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- GRADE LEVELS
-- =====================================================

CREATE TABLE grade_levels (
    grade_level_id INT AUTO_INCREMENT PRIMARY KEY,
    grade_name VARCHAR(20) NOT NULL UNIQUE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTIONS
-- =====================================================

CREATE TABLE sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    grade_level_id INT NOT NULL,
    section_name VARCHAR(50) NOT NULL,

    CONSTRAINT fk_section_grade
        FOREIGN KEY (grade_level_id)
        REFERENCES grade_levels(grade_level_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- STUDENTS
-- =====================================================

CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    student_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    photo VARCHAR(255),

    section_id INT NOT NULL,
    admin_id INT NOT NULL,

    CONSTRAINT fk_student_section
        FOREIGN KEY (section_id)
        REFERENCES sections(section_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_admin
        FOREIGN KEY (admin_id)
        REFERENCES system_admins(admin_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- QR CODES
-- =====================================================

CREATE TABLE qr_codes (
    qr_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    qr_value VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_qr_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- GATE LOGS
-- =====================================================

CREATE TABLE gate_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    qr_id INT NOT NULL,
    scan_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ENTRY','EXIT') DEFAULT 'ENTRY',

    CONSTRAINT fk_log_qr
        FOREIGN KEY (qr_id)
        REFERENCES qr_codes(qr_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USERS (Accounts / Parents / Guards)
-- =====================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'guard', 'parent') NOT NULL DEFAULT 'admin',
    active TINYINT(1) NOT NULL DEFAULT 1,
    google_id VARCHAR(100) DEFAULT NULL,
    google_email VARCHAR(100) DEFAULT NULL,
    linked_student_number VARCHAR(30) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_student
        FOREIGN KEY (linked_student_number)
        REFERENCES students(student_number)
        ON DELETE SET NULL
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- SYSTEM ADMIN
INSERT INTO system_admins (username, password, full_name, position, email)
VALUES ('ictadmin', 'admin123', 'Juan Dela Cruz', 'ICT Teacher', 'ict@school.edu.ph');

-- GRADE LEVELS
INSERT INTO grade_levels (grade_name)
VALUES ('Grade 7'), ('Grade 8'), ('Grade 9'), ('Grade 10'), ('Grade 11'), ('Grade 12');

-- SECTIONS
INSERT INTO sections (grade_level_id, section_name)
VALUES
(6, 'Einstein'),
(6, 'Newton'),
(5, 'HUMSS'),
(5, 'STEM'),
(4, 'Rizal'),
(3, 'Mabini'),
(2, 'Diamond'),
(1, 'Emerald');

-- STUDENTS
INSERT INTO students (student_number, first_name, middle_name, last_name, photo, section_id, admin_id)
VALUES
('2025001', 'Steven',         'G.', 'Ochigue',  'steven.jpg',    1, 1),
('2025002', 'Kent Lloyd',     'M.', 'Valmores',  'kent.jpg',      2, 1),
('2025003', 'Christine Rose', 'A.', 'Pahis',     'christine.jpg', 3, 1),
('2025004', 'Darren',         'J.', 'Watkins',   'darren.jpg',    4, 1);

-- QR CODES
INSERT INTO qr_codes (student_id, qr_value)
VALUES (1, 'STU-2025001'), (2, 'STU-2025002'), (3, 'STU-2025003'), (4, 'STU-2025004');

-- GATE LOGS
INSERT INTO gate_logs (qr_id, status)
VALUES (1, 'ENTRY'), (2, 'ENTRY'), (3, 'ENTRY'), (4, 'ENTRY');

-- USERS (Admin / Guard / Parent)
INSERT INTO users (username, password, full_name, role, active)
VALUES
('admin', '$2y$10$QYguvqSpl01t7yRhD3U.veSF2rXX.ZvnT7H/Bnkh9upZ1ssqxUWQa', 'System Administrator', 'admin', 1);
