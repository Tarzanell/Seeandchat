const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "Tarzanell",
  password: "Collinetta.1",
  database: "seeandchat",
});

db.connect(err => {
  if (err) {
    console.error("Errore di connessione al database:", err);
    return;
  }
  console.log("Connesso a MySQL!");
});

// Login utente
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT id, username FROM utenti WHERE username = ? AND password_hash = SHA2(?, 256)";
  
  db.query(sql, [username, password], (err, result) => {
    if (err) {
      res.status(500).send("Errore nel database");
    } else if (result.length > 0) {
      res.json({ success: true, utente: result[0] });
    } else {
      res.status(401).send("Credenziali errate");
    }
  });
});

// Recupero personaggi dell'utente
app.get("/api/personaggi/:utente_id", (req, res) => {
  const utente_id = req.params.utente_id;
  db.query("SELECT * FROM personaggi WHERE utente_id = ?", [utente_id], (err, result) => {
    if (err) {
      res.status(500).send("Errore nel database");
    } else {
      res.json(result);
    }
  });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Server avviato su http://localhost:3001");
});