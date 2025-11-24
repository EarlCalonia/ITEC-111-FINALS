-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 24, 2025 at 04:08 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `calonia_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `action_type` enum('Appointment','Patient','Doctor','System') DEFAULT 'System',
  `description` varchar(255) DEFAULT NULL,
  `status` enum('success','danger','warning','info') DEFAULT 'info',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `action_type`, `description`, `status`, `created_at`) VALUES
(1, 'System', 'Dashboard module initialized', 'info', '2025-11-24 14:22:44'),
(2, 'Patient', 'New patient registration: John Doe', 'success', '2025-11-24 14:22:44'),
(3, 'Appointment', 'Appointment Confirmed for 2025-11-24 at 10:30 AM', 'success', '2025-11-24 14:34:23'),
(4, 'Appointment', 'Appointment Completed for 2025-11-24 at 10:30 AM', 'success', '2025-11-24 14:34:27');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `time` varchar(20) NOT NULL,
  `duration` varchar(20) DEFAULT '30 min',
  `type` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('Confirmed','Pending','Completed','Cancelled') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `date`, `time`, `duration`, `type`, `notes`, `status`, `created_at`) VALUES
(2, 2, 2, '2025-11-24', '10:00 AM', '30 min', 'Pediatric Review', 'Follow up', 'Completed', '2025-11-24 13:04:45'),
(3, 3, 2, '2025-11-24', '09:30 AM', '30 min', 'chuchupa', 'HAHAHAHA', 'Completed', '2025-11-24 13:15:27'),
(4, 3, 2, '2025-11-24', '09:00 AM', '30 min', 'General Visit', '', 'Completed', '2025-11-24 13:55:50'),
(6, 5, 2, '2025-11-24', '10:30 AM', '30 min', 'General Visit', 'papatuli', 'Completed', '2025-11-24 14:34:16');

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `role` varchar(100) NOT NULL,
  `schedule_start` time DEFAULT '09:00:00',
  `schedule_end` time DEFAULT '17:00:00',
  `status` enum('Active','On Leave','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `first_name`, `last_name`, `email`, `phone`, `role`, `schedule_start`, `schedule_end`, `status`, `created_at`) VALUES
(1, 'James', 'Johnson', 'j.johnson@calonia.com', '555-0101', 'General Practitioner', '10:00:00', '17:00:00', 'Active', '2025-11-24 13:02:15'),
(2, 'Sarah', 'Davis', 's.davis@calonia.com', '555-0102', 'Pediatrician', '08:00:00', '16:00:00', 'Active', '2025-11-24 13:02:15'),
(3, 'Janine', 'Morant', 'jahmorant@gmail.com', '090909009', 'DRC', '09:00:00', '17:00:00', 'Active', '2025-11-24 14:35:07');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_leaves`
--

CREATE TABLE `doctor_leaves` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `leave_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_leaves`
--

INSERT INTO `doctor_leaves` (`id`, `doctor_id`, `leave_date`, `reason`) VALUES
(1, 2, '2025-11-25', 'Personal Leave');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `dob` date NOT NULL,
  `status` enum('Active','Inactive','Pending') DEFAULT 'Active',
  `last_visit` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `name`, `phone`, `email`, `dob`, `status`, `last_visit`, `created_at`) VALUES
(1, 'John Smith', '555-0101', 'john.smith@email.com', '1988-03-14', 'Active', '2025-01-10', '2025-11-24 12:52:19'),
(2, 'Sarah Williams', '555-0102', 'sarah.w@email.com', '1992-11-02', 'Active', '2025-01-08', '2025-11-24 12:52:19'),
(3, 'ratbu', '9090909', 'adad@gmail.com', '2025-11-27', 'Active', NULL, '2025-11-24 13:00:37'),
(4, 'adadsad', '123123', 'asdas@asasdas.com', '2025-11-24', 'Active', NULL, '2025-11-24 14:26:36'),
(5, 'Clarence Hahaha', '090909090', 'asdas@gmail.com', '2001-07-20', 'Active', NULL, '2025-11-24 14:33:33');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  ADD CONSTRAINT `doctor_leaves_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
