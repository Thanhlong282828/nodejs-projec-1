CREATE DATABASE IF NOT EXISTS week7_hrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS week7_hrm_notifications CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'week7_hrm'@'%' IDENTIFIED BY 'local-hrm-only';
CREATE USER IF NOT EXISTS 'week7_notify'@'%' IDENTIFIED BY 'local-notify-only';
GRANT ALL PRIVILEGES ON week7_hrm.* TO 'week7_hrm'@'%';
GRANT ALL PRIVILEGES ON week7_hrm_notifications.* TO 'week7_notify'@'%';
