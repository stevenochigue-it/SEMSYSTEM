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
-- =====================================================
-- ENTITY 3: SECTIONS
-- =====================================================
CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_level_id INT NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    teacher_adviser_name VARCHAR(100) DEFAULT NULL,
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
-- ENTITY 5: ENROLLMENTS (School Year & Dual-Mode Promotion)
-- =====================================================
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    grade_level_id INT NOT NULL,
    section_id INT NOT NULL,
    school_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    enrollment_status ENUM('Enrolled', 'Transferred', 'Graduated', 'Dropped') NOT NULL DEFAULT 'Enrolled',
    promotion_status ENUM('Promoted', 'Retained', 'Conditional') NOT NULL DEFAULT 'Promoted',
    enrollment_mode ENUM('automatic', 'manual') NOT NULL DEFAULT 'automatic',
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enrollments_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_grade_level
        FOREIGN KEY (grade_level_id)
        REFERENCES grade_levels(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_section
        FOREIGN KEY (section_id)
        REFERENCES sections(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ENTITY 6: QR CODES
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
-- ENTITY 7: TEACHERS / PERSONNEL
-- =====================================================
CREATE TABLE teachers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    employee_id      VARCHAR(30)  DEFAULT NULL UNIQUE,
    first_name       VARCHAR(50)  NOT NULL,
    middle_name      VARCHAR(50)  DEFAULT NULL,
    last_name        VARCHAR(50)  NOT NULL,
    subject          VARCHAR(100) DEFAULT NULL,
    grade_level      VARCHAR(30)  DEFAULT NULL,
    section_advisory VARCHAR(100) DEFAULT NULL,
    contact_number   VARCHAR(20)  DEFAULT NULL,
    status           ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- 3. SECTIONS (with assigned Teacher Adviser names)
INSERT INTO sections (grade_level_id, section_name, teacher_adviser_name) VALUES
(1, 'St. Lorenzo', 'Maria Santos'), (1, 'St. Michael', 'Juan Dela Cruz'), (1, 'St. Vincent', 'Ana Reyes'), (1, 'St. Raphael', 'Carlos Garcia'),
(2, 'St. Barachel', 'Elena Torralba'), (2, 'St. Uriel', 'Roberto Mendoza'), (2, 'St. Sealtiel', 'Grace Villareal'), (2, 'St. Gabriel', 'Antonio Aquino'),
(3, 'St. John', 'Luzviminda Ramos'), (3, 'St. Paul', 'Fernan Custodio'), (3, 'St. Anthony', 'Clara Benitez'), (3, 'St. James', 'Mark Anthony Tan'),
(4, 'St. Matthew', 'Teresa Bautista'), (4, 'St. Luke', 'Rogelio Corpuz'), (4, 'St. Thomas', 'Sonia Valenzuela'),
(5, 'GAS - Faithful', 'Dominic Sison'), (5, 'GAS - Loyalty', 'Patricia Lim'), (5, 'GAS - Patience', 'Gabriel Navarro'),
(6, 'GAS - Compassionate', 'Corazon Abad'), (6, 'GAS - Integrity', 'Ramon Morales');

-- 4. STUDENTS
INSERT INTO students (student_id_number, first_name, middle_name, last_name, photo, section_id, created_by_user_id) VALUES
('STU-109283746501', 'Steven', 'G.', 'Ochigue', 'steven.jpg', 1, 1),
('STU-109283746502', 'Kent Lloyd', 'M.', 'Valmores', 'kent.jpg', 16, 1),
('STU-109283746503', 'Christine Rose', 'A.', 'Pahis', 'christine.jpg', 9, 1),
('STU-109283746504', 'Darren', 'J.', 'Watkins', 'darren.jpg', 19, 1);

-- 5. ENROLLMENTS
INSERT INTO enrollments (student_id, grade_level_id, section_id, school_year, enrollment_status, promotion_status, enrollment_mode) VALUES
(1, 1, 1, '2025-2026', 'Enrolled', 'Promoted', 'automatic'),
(2, 5, 16, '2025-2026', 'Enrolled', 'Promoted', 'automatic'),
(3, 3, 9, '2025-2026', 'Enrolled', 'Promoted', 'automatic'),
(4, 6, 19, '2025-2026', 'Enrolled', 'Promoted', 'manual');

-- 6. QR CODES
INSERT INTO qr_codes (student_id, qr_value) VALUES
(1, 'STU-109283746501'),
(2, 'STU-109283746502'),
(3, 'STU-109283746503'),
(4, 'STU-109283746504');

-- 7. GATE LOGS
INSERT INTO gate_logs (qr_id, status) VALUES
(1, 'ENTRY'), (2, 'ENTRY'), (3, 'ENTRY'), (4, 'ENTRY');

