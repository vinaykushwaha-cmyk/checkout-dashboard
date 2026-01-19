-- MySQL Permissions Fix Script
-- Run this in phpMyAdmin SQL tab (you need root/admin privileges)

-- Option 1: Allow connection from your specific IP (More Secure)
CREATE USER IF NOT EXISTS 'appypieml'@'172.16.15.223' IDENTIFIED BY '0ns!sdev_Secure#11';
GRANT ALL PRIVILEGES ON appypieml_db_local.* TO 'appypieml'@'172.16.15.223';
FLUSH PRIVILEGES;

-- Option 2: Allow connection from any IP (Less Secure, but simpler)
-- Uncomment the lines below if you want to use this option instead
-- CREATE USER IF NOT EXISTS 'appypieml'@'%' IDENTIFIED BY '0ns!sdev_Secure#11';
-- GRANT ALL PRIVILEGES ON appypieml_db_local.* TO 'appypieml'@'%';
-- FLUSH PRIVILEGES;

-- Check current user permissions
SELECT user, host FROM mysql.user WHERE user='appypieml';
