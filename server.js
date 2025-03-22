const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const app = express();
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");


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
  console.log("Inizio login");
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

      //console.log("Password ricevuta:", password);
      //console.log("Hash nel database:", user.password_hash);

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

// Nuovo personaggio
app.post("/api/aggiungi-personaggio", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    const utente_id = decoded.id; 

    const { nome, velocita, forza, destrezza, costituzione, punti_vita, token_img } = req.body;

    // Controllo server-side
    if (forza > 15 || destrezza > 15 || costituzione > 15) {
      return res.status(400).json({ message: "Le statistiche non possono superare 15." });
    }

    await db.query(
      "INSERT INTO personaggi (nome, velocita, forza, destrezza, costituzione, punti_vita, utente_id, token_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [nome, velocita, forza, destrezza, costituzione, punti_vita, utente_id, token_img]
    );

    res.status(201).json({ message: "Personaggio aggiunto con successo" });
  } catch (error) {
    console.error("Errore nell'aggiunta del personaggio:", error);
    res.status(500).json({ error: "Errore nel server" });
  }
});

// Cancella personaggio
app.delete("/api/personaggi/:id", async (req, res) => {
  try {
    console.log("Tentativo di eliminare il personaggio con ID:", req.params.id);

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    const utente_id = decoded.id;

    // 🔹 Controlla che il personaggio appartenga all'utente
    const [rows] = await db.query("SELECT * FROM personaggi WHERE id = ? AND utente_id = ?", [req.params.id, utente_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Personaggio non trovato o non autorizzato" });
    }

    await db.query("DELETE FROM personaggi WHERE id = ?", [req.params.id]);
    res.json({ message: "Personaggio eliminato con successo" });

  } catch (error) {
    console.error("Errore nell'eliminazione:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Recupero personaggi dell'utente
app.get("/api/listapersonaggi/:utente_id", (req, res) => {
  console.log("Inizio ricerca personaggi");
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

// Dettagli personaggio
app.get("/api/personaggi/:id", async (req, res) => { 
  try {
    console.log("🔹 Inizio ricerca dettaglichar");

    // 🔸 Controlla se arriva il token nell'header della richiesta
    const authHeader = req.headers.authorization;
    console.log("🔹 Header Authorization:", authHeader);
    
    if (!authHeader) {
      console.error("❌ Token mancante!");
      return res.status(401).json({ message: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔹 Token ricevuto:", token);

    // 🔸 Decodifica il token
    let decoded;
    try {
      decoded = jwt.verify(token, "supersegreto");
    } catch (err) {
      console.error("❌ Errore nella decodifica del token:", err.message);
      return res.status(403).json({ error: "Token non valido" });
    }

    const utente_id = decoded.id; // Estrai l'ID utente dal token
    console.log("✅ Token valido - ID utente:", utente_id);

    // 🔸 Controlla che l'ID del personaggio sia numerico (per evitare SQL injection)
    const personaggio_id = parseInt(req.params.id, 10);
    if (isNaN(personaggio_id)) {
      console.error("❌ ID personaggio non valido:", req.params.id);
      return res.status(400).json({ error: "ID personaggio non valido" });
    }
    console.log("🔹 ID PG richiesto:", personaggio_id);

    // 🔹 Cerca il personaggio per ID e verifica che appartenga all'utente loggato
    const [rows] = await db.query("SELECT * FROM personaggi WHERE id = ? AND utente_id = ?", [personaggio_id, utente_id]);

    if (rows.length === 0) {
      console.warn("⚠️ Nessun personaggio trovato con ID:", personaggio_id, "per utente ID:", utente_id);
      return res.status(404).json({ message: "Personaggio non trovato" });
    }

    console.log("✅ Personaggio trovato:", rows[0]); 
    res.json(rows[0]); // 🔹 Invia i dettagli del personaggio

  } catch (error) {
    console.error("❌ Errore nel recupero del personaggio:", error);
    res.status(500).json({ error: error.message });
  }
});

// Non lo so
app.get("/api/listapersonaggi", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // 🔹 Estrae il token
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto"); // 🔹 Decodifica il token
    const utente_id = decoded.id; // 🔹 Estrai ID utente dal token

    const [personaggi] = await db.query("SELECT * FROM personaggi WHERE utente_id = ?", [utente_id]);
    res.json(personaggi);
  } catch (error) {
    console.error("Errore nel recupero dei personaggi:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Configurazione multer per il caricamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Cartella dove salvare le immagini
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rinomina il file con timestamp
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 }, // 500 KB massimo (puoi cambiarlo)
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Solo file .jpeg, .jpg o .png sono ammessi"));
    }
  }
});

// 🔥 API per caricare l'immagine del token
app.post("/api/upload", upload.single("token"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nessun file caricato" });
    }

    res.json({ filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: "Errore nel caricamento dell'immagine" });
  }
});



//Cos'è sta roba?
const os = require("os");
const interfaces = os.networkInterfaces();
const serverIP = Object.values(interfaces)
  .flat()
  .find((iface) => iface.family === "IPv4" && !iface.internal)?.address || "localhost";

  console.log(app._router.stack.map(r => r.route && r.route.path).filter(r => r));

app.listen(3001, "0.0.0.0", () => {
  console.log(`Server avviato su http://${serverIP}:3001`);
});