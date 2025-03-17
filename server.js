const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: "217.154.16.188",
  user: "Tarzanell",
  password: "Collinetta.1",
  database: "seeandchat",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testDbConnection() {
  try {
    const connection = await db.getConnection();
    console.log("Connessione al database riuscita!");
    connection.release();
  } catch (error) {
    console.error("Errore di connessione al database:", error);
  }
}

testDbConnection();

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
    res.status(500).json({ error: error.message });
  }
});

const os = require("os");
const interfaces = os.networkInterfaces();
const serverIP = Object.values(interfaces)
  .flat()
  .find((iface) => iface.family === "IPv4" && !iface.internal)?.address || "localhost";

app.listen(3001, "0.0.0.0", () => {
  console.log(`Server avviato su http://${serverIP}:3001`);
});