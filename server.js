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
      console.error("Errore nel database:", err);
      res.status(500).send({ error: "Errore nel database" });
    } else if (result.length === 0) {
      res.status(404).json({ message: "Nessun personaggio trovato per questo utente." });
    } else {
      res.json(result);
    }
  });
});

app.get("/api/personaggi", async (req, res) => { 
  try {
    const [personaggi] = await db.query("SELECT * FROM personaggi");
    res.json(personaggi);
  } catch (error) {
    console.error("Errore nel recupero dei personaggi:", error);
    res.status(500).json({ error: error.message }); // Mostra l'errore SQL
  }
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Server avviato su http://localhost:3001");
});