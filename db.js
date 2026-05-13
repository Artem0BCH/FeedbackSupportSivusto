import mysql from "mysql2/promise";
import dbconfig from "./dbconfig.json" with { type: "json" };

let dbPool = mysql.createPool(dbconfig);

const openConn = async () => {
  try {
    let conn = await dbPool.getConnection();
    return conn;
  } catch (err) {
    console.error("DB connection failed:", err);
    throw err;
  }
};

const getFeedback = async () => {
  try {
    let conn = await openConn();
    let query = "SELECT * FROM feedback";
    const [results] = await conn.execute(query);
    conn.release();
    return results;
  } catch (err) {
    console.error("getFeedback error:", err);
    throw err;
  }
};

const getCustomersUsers = async () => {
  try {
    let conn = await openConn();
    const query = `
        SELECT 
            customer.name,
            system_user.id AS user_id,
            system_user.fullname,
            system_user.email
        FROM customer
        JOIN system_user
        ON system_user.customer_id = customer.id
        ORDER BY customer.name
        `;
    let [data] = await conn.execute(query);
    conn.release();
    return data;
  } catch (err) {
    console.error("getCustomersUsers error:", err);
    throw err;
  }
};

const getSupportTickets = async () => {
  try {
    let conn = await openConn();
    const query = `
        SELECT 
            support_ticket.id,
            ticket_status.description AS status,
            support_ticket.customer_id,
            support_ticket.arrived,
            customer.name,
            system_user.email,
            support_ticket.description,
            support_ticket.handled
        FROM support_ticket
        JOIN customer ON support_ticket.customer_id = customer.id
        JOIN system_user ON system_user.customer_id = customer.id
        JOIN ticket_status ON support_ticket.status = ticket_status.id
        ORDER BY customer.name
        `;
    let [data] = await conn.execute(query);
    conn.release();
    return data;
  } catch (err) {
    console.error("getSupportTickets error:", err);
    throw err;
  }
};

const getTicketById = async (id) => {
  let conn = await openConn();
  const query = `
    SELECT 
        support_ticket.id,
        ticket_status.description AS status,
        support_ticket.arrived,
        customer.name,
        support_ticket.description,
        support_ticket.handled
    FROM support_ticket
    JOIN customer ON support_ticket.customer_id = customer.id
    JOIN ticket_status ON support_ticket.status = ticket_status.id
    WHERE support_ticket.id = ?
    `;
  const [rows] = await conn.execute(query, [id]);
  conn.release();
  return rows[0];
};

const getMessagesByTicket = async (id) => {
  let conn = await openConn();
  const query = `
    SELECT 
        support_message.*, 
        system_user.email,
        system_user.fullname,
        system_user.admin
    FROM support_message
    JOIN system_user 
    ON support_message.from_user = system_user.id
    WHERE support_message.ticket_id = ?
    ORDER BY support_message.created_at
    `;
  let [rows] = await conn.execute(query, [id]);
  conn.release();
  return rows;
};

const addMessage = async (ticket_id, message, user_id) => {
  let conn = await openConn();
  const query = `
    INSERT INTO support_message (ticket_id, from_user, body)
    VALUES (?, ?, ?)
    `;
  await conn.execute(query, [ticket_id, user_id, message]);
  conn.release();
};

const updateTicketStatus = async (id, status) => {
  let conn = await openConn();
  let query;
  let queryParams;

  if (status == 4) {
    query = `
        UPDATE support_ticket
        SET status = ?, handled = NOW()
        WHERE id = ?
        `;
    queryParams = [status, id];
  } else {
    query = `
        UPDATE support_ticket
        SET status = ?
        WHERE id = ?
        `;
    queryParams = [status, id];
  }
  await conn.execute(query, queryParams);
  conn.release();
};

const getUserByLogin = async (login) => {
  let conn = await openConn();
  const query = `
    SELECT id, email, admin, password
    FROM system_user
    WHERE email = ? OR id = ?
    `;
  const [rows] = await conn.execute(query, [login, login]);
  console.log("LOGIN VALUE:", login);
  console.log("USER FROM DB:", rows[0]);
  return rows[0];
};

export default {
  getFeedback,
  getCustomersUsers,
  getSupportTickets,
  getTicketById,
  getMessagesByTicket,
  addMessage,
  updateTicketStatus,
  getUserByLogin,
};
