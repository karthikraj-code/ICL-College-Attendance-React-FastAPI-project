-- Runs automatically the first time the MySQL container starts with an empty volume.
-- Official image path: /docker-entrypoint-initdb.d/init.sql
-- The database and app user are created from MYSQL_DATABASE / MYSQL_USER / MYSQL_PASSWORD.

CREATE DATABASE IF NOT EXISTS attendance_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE attendance_db;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  CONSTRAINT fk_attendance_student
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_subject
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT uq_attendance_record
    UNIQUE (student_id, subject_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample seed data (safe to re-run: skips duplicates)
INSERT IGNORE INTO students (id, name, roll_number, email) VALUES
  (1, 'Aarav Sharma',     'CS2021001', 'aarav.sharma@college.edu'),
  (2, 'Diya Patel',       'CS2021002', 'diya.patel@college.edu'),
  (3, 'Rohan Mehta',      'CS2021003', 'rohan.mehta@college.edu'),
  (4, 'Ananya Iyer',      'CS2021004', 'ananya.iyer@college.edu'),
  (5, 'Kabir Singh',      'CS2021005', 'kabir.singh@college.edu'),
  (6, 'Meera Nair',       'CS2021006', 'meera.nair@college.edu'),
  (7, 'Vikram Joshi',     'CS2021007', 'vikram.joshi@college.edu'),
  (8, 'Sneha Reddy',      'CS2021008', 'sneha.reddy@college.edu');

INSERT IGNORE INTO subjects (id, name, code) VALUES
  (1, 'Database Management Systems', 'CS301'),
  (2, 'Operating Systems',           'CS302'),
  (3, 'Web Development',             'CS303'),
  (4, 'Computer Networks',           'CS304');

INSERT IGNORE INTO attendance (student_id, subject_id, attendance_date, status) VALUES
  -- 2026-10-20 (DBMS)
  (1, 1, '2026-10-20', 'Present'),
  (2, 1, '2026-10-20', 'Present'),
  (3, 1, '2026-10-20', 'Absent'),
  (4, 1, '2026-10-20', 'Present'),
  (5, 1, '2026-10-20', 'Present'),
  (6, 1, '2026-10-20', 'Absent'),
  (7, 1, '2026-10-20', 'Present'),
  (8, 1, '2026-10-20', 'Present'),
  -- 2026-10-21 (OS)
  (1, 2, '2026-10-21', 'Present'),
  (2, 2, '2026-10-21', 'Absent'),
  (3, 2, '2026-10-21', 'Present'),
  (4, 2, '2026-10-21', 'Present'),
  (5, 2, '2026-10-21', 'Absent'),
  (6, 2, '2026-10-21', 'Present'),
  (7, 2, '2026-10-21', 'Present'),
  (8, 2, '2026-10-21', 'Present'),
  -- 2026-10-22 (Web)
  (1, 3, '2026-10-22', 'Absent'),
  (2, 3, '2026-10-22', 'Present'),
  (3, 3, '2026-10-22', 'Present'),
  (4, 3, '2026-10-22', 'Absent'),
  (5, 3, '2026-10-22', 'Present'),
  (6, 3, '2026-10-22', 'Present'),
  (7, 3, '2026-10-22', 'Present'),
  (8, 3, '2026-10-22', 'Absent'),
  -- 2026-10-23 (Networks)
  (1, 4, '2026-10-23', 'Present'),
  (2, 4, '2026-10-23', 'Present'),
  (3, 4, '2026-10-23', 'Present'),
  (4, 4, '2026-10-23', 'Present'),
  (5, 4, '2026-10-23', 'Absent'),
  (6, 4, '2026-10-23', 'Present'),
  (7, 4, '2026-10-23', 'Absent'),
  (8, 4, '2026-10-23', 'Present'),
  -- 2026-10-24 (DBMS again)
  (1, 1, '2026-10-24', 'Present'),
  (2, 1, '2026-10-24', 'Present'),
  (3, 1, '2026-10-24', 'Present'),
  (4, 1, '2026-10-24', 'Absent'),
  (5, 1, '2026-10-24', 'Present'),
  (6, 1, '2026-10-24', 'Present'),
  (7, 1, '2026-10-24', 'Present'),
  (8, 1, '2026-10-24', 'Present'),
  -- 2026-10-27 (OS again)
  (1, 2, '2026-10-27', 'Present'),
  (2, 2, '2026-10-27', 'Present'),
  (3, 2, '2026-10-27', 'Absent'),
  (4, 2, '2026-10-27', 'Present'),
  (5, 2, '2026-10-27', 'Present'),
  (6, 2, '2026-10-27', 'Absent'),
  (7, 2, '2026-10-27', 'Present'),
  (8, 2, '2026-10-27', 'Present');
