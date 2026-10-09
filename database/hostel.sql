CREATE DATABASE IF NOT EXISTS hostel_management;
USE hostel_management;
CREATE TABLE IF NOT EXISTS students (
 id INT AUTO_INCREMENT PRIMARY KEY, full_name VARCHAR(100) NOT NULL,
 email VARCHAR(120) UNIQUE, phone VARCHAR(20), course VARCHAR(100) NOT NULL,
 room_no VARCHAR(10), status ENUM('Active','Inactive') DEFAULT 'Active',
 admission_date DATE DEFAULT (CURRENT_DATE), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS rooms (
 id INT AUTO_INCREMENT PRIMARY KEY, room_no VARCHAR(10) UNIQUE NOT NULL,
 capacity INT NOT NULL DEFAULT 2, occupied INT NOT NULL DEFAULT 0,
 room_type VARCHAR(30) DEFAULT 'Shared', CHECK(capacity > 0), CHECK(occupied >= 0 AND occupied <= capacity)
);
CREATE TABLE IF NOT EXISTS staff (
 id INT AUTO_INCREMENT PRIMARY KEY, full_name VARCHAR(100) NOT NULL,
 role VARCHAR(50) NOT NULL, phone VARCHAR(20), status ENUM('Active','Inactive') DEFAULT 'Active'
);
CREATE TABLE IF NOT EXISTS fees (
 id INT AUTO_INCREMENT PRIMARY KEY, student_id INT NOT NULL, amount DECIMAL(10,2) NOT NULL,
 paid_amount DECIMAL(10,2) DEFAULT 0, due_date DATE,
 status ENUM('Paid','Pending','Partial') DEFAULT 'Pending',
 FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS complaints (
 id INT AUTO_INCREMENT PRIMARY KEY, student_id INT, title VARCHAR(150) NOT NULL,
 description TEXT, status ENUM('Open','In Progress','Resolved') DEFAULT 'Open',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS attendance (
 id INT AUTO_INCREMENT PRIMARY KEY, student_id INT NOT NULL, attendance_date DATE NOT NULL,
 status ENUM('Present','Absent','On Leave') DEFAULT 'Present', UNIQUE(student_id, attendance_date),
 FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
 email VARCHAR(120) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL,
 role ENUM('Admin','Warden','Accountant') DEFAULT 'Admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS visitors (
 id INT AUTO_INCREMENT PRIMARY KEY, student_id INT NOT NULL, visitor_name VARCHAR(100) NOT NULL,
 relation VARCHAR(50), phone VARCHAR(20), purpose VARCHAR(150),
 check_in DATETIME DEFAULT CURRENT_TIMESTAMP, check_out DATETIME NULL,
 FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS mess_menu (
 id INT AUTO_INCREMENT PRIMARY KEY,
 day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
 meal_type ENUM('Breakfast','Lunch','Snacks','Dinner') NOT NULL,
 items VARCHAR(255) NOT NULL, UNIQUE(day_of_week, meal_type)
);
CREATE TABLE IF NOT EXISTS leave_requests (
 id INT AUTO_INCREMENT PRIMARY KEY, student_id INT NOT NULL, from_date DATE NOT NULL, to_date DATE NOT NULL,
 reason VARCHAR(255) NOT NULL, status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
INSERT IGNORE INTO rooms(room_no,capacity,occupied,room_type) VALUES
('101',2,2,'Shared'),('102',2,1,'Shared'),('103',3,3,'Deluxe'),('104',2,1,'Standard'),('105',2,2,'Shared'),('106',3,0,'Deluxe');
INSERT IGNORE INTO students(id,full_name,email,phone,course,room_no) VALUES
(1,'Aarav Patel','aarav@example.com','9876501001','MCA','101'),
(2,'Priya Sharma','priya@example.com','9876501002','B.Tech','102'),
(3,'Rahul Singh','rahul@example.com','9876501003','BCA','103'),
(4,'Neha Joshi','neha@example.com','9876501004','MCA','104'),
(5,'Karan Mehta','karan@example.com','9876501005','BBA','105');
INSERT IGNORE INTO staff(id,full_name,role,phone) VALUES
(1,'Ramesh Parmar','Warden','9876511001'),(2,'Sunita Shah','Accountant','9876511002'),(3,'Vikram Das','Security Guard','9876511003');
INSERT IGNORE INTO fees(id,student_id,amount,paid_amount,due_date,status) VALUES
(1,1,15000,15000,'2026-11-01','Paid'),(2,2,15000,15000,'2026-11-01','Paid'),
(3,3,15000,5000,'2026-11-01','Partial'),(4,4,15000,0,'2026-11-01','Pending'),(5,5,15000,5000,'2026-11-01','Partial');

INSERT IGNORE INTO mess_menu(day_of_week,meal_type,items) VALUES
('Monday','Breakfast','Poha, Tea'),('Monday','Lunch','Dal, Rice, Roti, Sabzi'),('Monday','Snacks','Biscuits, Tea'),('Monday','Dinner','Paneer, Roti, Rice'),
('Tuesday','Breakfast','Upma, Tea'),('Tuesday','Lunch','Rajma, Rice, Roti'),('Tuesday','Snacks','Samosa'),('Tuesday','Dinner','Mixed Veg, Roti, Dal');
INSERT IGNORE INTO complaints(id,student_id,title,description,status) VALUES
(1,1,'Fan not working','Ceiling fan in room 101 is not running','Open'),
(2,3,'Water leakage','Bathroom tap leaking','In Progress');
INSERT IGNORE INTO leave_requests(id,student_id,from_date,to_date,reason,status) VALUES
(1,2,'2026-10-20','2026-10-25','Family function','Pending');
INSERT IGNORE INTO visitors(id,student_id,visitor_name,relation,phone,purpose) VALUES
(1,1,'Mahesh Patel','Father','9876599001','Meeting');
-- Admin login (admin@hostel.com / admin123) is created automatically by the backend on first start.
