const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const app = express();
const bcrypt = require("bcrypt");


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


const jwt = require("jsonwebtoken"); // Importa il modulo JWT
const SECRET_KEY = "supersegreto"; // Sostituiscilo con una chiave segreta più sicura

function generateToken(user) {
  return jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: "1h" } // Il token scade in 1 ora
  );
}

// Registrazione utente
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const [existingUsers] = await db.query("SELECT * FROM utenti WHERE username = ?", [username]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Username già in uso" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO utenti (username, password_hash, email) VALUES (?, ?, ?)", [username, password_hash, email]);

    res.status(201).json({ message: "Registrazione completata con successo" });
  } catch (error) {
    console.error("Errore nella registrazione:", error);
    res.status(500).json({ error: "Errore nel server" });
  }
});

// Login utente
app.post("/api/login", async (req, res) => {
  try {
      const { username, password } = req.body;
      const [rows] = await db.query("SELECT * FROM utenti WHERE username = ?", [username]);

      if (rows.length === 0) {
          return res.status(401).json({ message: "Utente non trovato" });
      }

      const user = rows[0];

      // Controlliamo se la colonna della password esiste.
      if (!user.password_hash) {
          return res.status(500).json({ error: "Errore: nessuna password trovata per questo utente" });
      }

      console.log("Password ricevuta:", password);
      console.log("Hash nel database:", user.password_hash);

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
          return res.status(401).json({ message: "Password errata" });
      }

      const token = generateToken(user); // Assicurati che questa funzione esista
      res.json({ token });
  } catch (error) {
      console.error("Errore login:", error);
      res.status(500).json({ error: "Errore nel server" });
  }
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

// Non lo so
app.get("/api/personaggi", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // 🔹 Estrae il token
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "secret_key"); // 🔹 Decodifica il token
    const utente_id = decoded.id; // 🔹 Estrai ID utente dal token

    const [personaggi] = await db.query("SELECT * FROM personaggi WHERE utente_id = ?", [utente_id]);
    res.json(personaggi);
  } catch (error) {
    console.error("Errore nel recupero dei personaggi:", error);
    res.status(500).json({ error: error.message });
  }
});

//Cos'è sta roba?
const os = require("os");
const interfaces = os.networkInterfaces();
const serverIP = Object.values(interfaces)
  .flat()
  .find((iface) => iface.family === "IPv4" && !iface.internal)?.address || "localhost";

app.listen(3001, "0.0.0.0", () => {
  console.log(`Server avviato su http://${serverIP}:3001`);
});