DROP DATABASE IF EXISTS feedback_support;
CREATE DATABASE feedback_support;
USE feedback_support;

DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    arrived TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    from_user INT,
    guest_name VARCHAR(256),
    guest_email VARCHAR(256),
    feedback VARCHAR(1024),
    handled TIMESTAMP NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS system_user;
CREATE TABLE system_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(256),
    email VARCHAR(256) NOT NULL,
    mailing_list BOOLEAN NOT NULL DEFAULT false,
    customer_id INT,
    admin BOOLEAN NOT NULL DEFAULT false
) ENGINE=InnoDB;

DROP TABLE IF EXISTS customer;
CREATE TABLE customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(256)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS support_ticket;
CREATE TABLE support_ticket (
    id INT AUTO_INCREMENT PRIMARY KEY,
    arrived TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_id INT,
    description VARCHAR(1024),
    handled TIMESTAMP NULL,
    status INT
) ENGINE=InnoDB;

DROP TABLE IF EXISTS  ticket_status;
CREATE TABLE ticket_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(256)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS support_message;
CREATE TABLE support_message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ticket_id INT,
    reply_to INT,
    from_user INT,
    body VARCHAR(1024)
) ENGINE=InnoDB;

CREATE DATABASE logindemo;
USE logindemo;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);
INSERT INTO `users`  (`id`, `password`)
VALUES ('1', '$2b$10$YFgdsCJC0d8y1kPIX.bOEOBicbxO/GTJx.P3hlAeq6m.0nyeQREtu');

ALTER TABLE system_user ADD COLUMN password VARCHAR(255);

ALTER TABLE feedback
ADD CONSTRAINT fk_feedback_user 
    FOREIGN KEY (from_user)
    REFERENCES system_user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE system_user
ADD CONSTRAINT fk_user_customer 
    FOREIGN KEY (customer_id)
    REFERENCES customer (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE support_ticket
ADD CONSTRAINT fk_ticket_customer 
    FOREIGN KEY (customer_id)
    REFERENCES customer (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE support_ticket
ADD CONSTRAINT fk_ticket_status 
    FOREIGN KEY (status)
    REFERENCES ticket_status (id);

ALTER TABLE support_message
ADD CONSTRAINT fk_message_ticket
    FOREIGN KEY (ticket_id)
    REFERENCES support_ticket (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE support_message
ADD CONSTRAINT fk_message_reply
    FOREIGN KEY (reply_to)
    REFERENCES support_message (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE support_message
ADD CONSTRAINT fk_message_user
    FOREIGN KEY (from_user)
    REFERENCES system_user (id);
