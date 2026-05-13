import express from "express";
import { fileURLToPath } from "node:url";
import path from "path";
import config from "./config.json" with { type: "json" };
import db from "./db.js";
import session from "express-session";
import bcrypt from "bcrypt";

const app = express();

let serverHost = config.host;
let serverPort = config.port;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/inc", express.static("includes"));
app.get("/login.js", (req, res) =>
  res.sendFile(path.join(__dirname, "login.js")),
);
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "salasana1234",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

const loginRequired = (req, res, next) => {
  if (!req.session.user) {
    req.session.loginMessage = "Kirjaudu ensin sisään!";
    res.redirect("/feedback");
    return;
  }
  next();
};

app.get("/", (req, res) => {
  res.redirect("/feedback");
});

app.get("/feedback", async (req, res) => {
  try {
    let feedbackData = await db.getFeedback();
    res.render("feedback", {
      rows: feedbackData,
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Database error. " + err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/customers-users", async (req, res) => {
  try {
    let rows = await db.getCustomersUsers();
    res.render("customers-users", {
      rows: rows,
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Database error. " + err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/support-tickets", loginRequired, async (req, res) => {
  try {
    let rows = await db.getSupportTickets();
    res.render("support-tickets", {
      rows: rows,
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Database error. " + err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/ticket", loginRequired, async (req, res) => {
  let ticketId = req.query.id;
  const ticket = await db.getTicketById(ticketId);
  let messages = await db.getMessagesByTicket(ticketId);
  console.log(messages);
  res.render("ticket", { ticket, messages });
});

app.post("/reply", async (req, res) => {
  let ticketId = req.body.ticket_id;
  let msg = req.body.message;
  await db.addMessage(ticketId, msg, req.session.user.id);
  res.redirect("/ticket?id=" + ticketId);
});

app.post("/update-status", async (req, res) => {
  const ticketId = req.body.ticket_id;
  const newStatus = req.body.status;
  await db.updateTicketStatus(ticketId, newStatus);
  res.redirect("/ticket?id=" + ticketId);
});

app.post("/login", async (req, res) => {
  const loginVal = req.body.uname || req.body.id;
  const password = req.body.password;
  const returnTo = req.body.returnTo;
  let user = await db.getUserByLogin(loginVal);
  if (!user) {
    req.session.loginMessage = "User not found.";
    return res.redirect(returnTo || "/feedback");
  }
  if (!user.admin) {
    req.session.loginMessage = "Access denied.";
    return res.redirect(returnTo || "/feedback");
  }
  bcrypt.compare(password, user.password, (err, match) => {
    if (match) {
      req.session.user = { id: user.id, uname: user.uname };
      return res.redirect("/");
    } else {
      req.session.loginMessage = "Kirjautuminen epäonnistui!";
      return res.redirect(returnTo || "/feedback");
    }
  });
});

app.get("/logout", (req, res) => {
  let goBack = req.headers.referer;
  req.session.destroy(function (err) {
    if (err) {
      return res.send("Logout epäonnistui");
    }
    res.redirect(goBack);
  });
});

app.listen(
  serverPort,
  serverHost,
  console.log(`${serverHost}:${serverPort} kuuntelee...`),
);
