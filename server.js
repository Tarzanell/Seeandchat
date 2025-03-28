const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const app = express();
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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
      { id: user.id, username: user.username, is_dm: user.is_dm },
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
  //console.log("Inizio login");
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
    const username = decoded.username;

    const { nome, velocita, forza, destrezza, costituzione, punti_vita, token_img } = req.body;

    // Controllo server-side
    if (forza > 15 || destrezza > 15 || costituzione > 15) {
      return res.status(400).json({ message: "Le statistiche non possono superare 15." });
    }

    const [result] = await db.query(
      "INSERT INTO personaggi (nome, velocita, forza, destrezza, costituzione, punti_vita, utente_id, token_img, mappa_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [nome, velocita, forza, destrezza, costituzione, punti_vita, utente_id, token_img, 1]
    );


    const personaggioId = result.insertId;

    await db.query(
      "INSERT INTO tokens (id, mappa_id, categoria, proprietario_id, posizione_x, posizione_y, immagine, nome, fatherid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [personaggioId, 1, "personaggio", username, 0, 0, token_img, nome, personaggioId]
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

// Visualizzazione Mappe
app.get("/api/tutte-le-mappe", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM mappe");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero mappe:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Restituisce tutti i token di una determinata mappa
app.get("/api/tokens/:mappa_id", async (req, res) => {
  try {
    const mappa_id = parseInt(req.params.mappa_id, 10);
    const [rows] = await db.query("SELECT * FROM tokens WHERE mappa_id = ?", [mappa_id]);
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero dei token:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// API: Recupera il token associato a un personaggio (via fatherid)
app.get("/api/miotoken/:characterId", async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const [rows] = await db.query(
      "SELECT * FROM tokens WHERE categoria = 'personaggio' AND fatherid = ? LIMIT 1",
      [characterId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Token non trovato per questo personaggio" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Errore nel recupero del token del personaggio:", err);
    res.status(500).json({ message: "Errore del server" });
  }
});

// Aggiornamento posizione token dopo drag
app.patch("/api/token/:id/posizione", async (req, res) => {
  try {
    const tokenId = req.params.id;
    const { posizione_x, posizione_y } = req.body;

    // Autenticazione
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token mancante" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");

    // Controllo autorizzazione (solo proprietario o DM)
    const [rows] = await db.query("SELECT proprietario_id FROM tokens WHERE id = ?", [tokenId]);
    if (rows.length === 0) return res.status(404).json({ message: "Token non trovato" });

    const tokenDb = rows[0];
    const isOwner = tokenDb.proprietario_id === decoded.username;
    //console.log("Proprietario:", tokenDb.proprietario_id);
    //console.log("Utente:", decoded.username);
    
    if (!isOwner && !decoded.is_dm) {
      return res.status(403).json({ message: "Non autorizzato a spostare questo token" });
    }

    // Aggiorna posizione
    await db.query("UPDATE tokens SET posizione_x = ?, posizione_y = ? WHERE id = ?", [posizione_x, posizione_y, tokenId]);
    res.json({ message: "Posizione aggiornata con successo" });

  } catch (error) {
    console.error("Errore aggiornamento posizione:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Recupera tutti gli archetipi mob
app.get("/api/archetipi-mob", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Accesso negato" });

    const [rows] = await db.query("SELECT * FROM archetipi_mob");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero archetipi mob:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Recupera tutti gli archetipi oggetti
app.get("/api/archetipi-oggetti", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Accesso negato" });

    const [rows] = await db.query("SELECT * FROM archetipi_oggetti");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero archetipi oggetti:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Recupera tutti gli NPC
app.get("/api/npc", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const [rows] = await db.query("SELECT * FROM npc");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero NPC:", error);
    res.status(500).json({ error: "Errore server" });
  }
});

// Recupera tutte le transizioni
app.get("/api/transizioni", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const [rows] = await db.query("SELECT * FROM transizioni");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero Transizioni:", error);
    res.status(500).json({ error: "Errore server" });
  }
});

// Cancella archetipi mob
app.delete("/api/archetipi-mob/:id", async (req, res) => {
  await db.query("DELETE FROM archetipi_mob WHERE id = ?", [req.params.id]);
  res.json({ message: "Archetipo mob eliminato" });
});

// Cancella archetipi
app.delete("/api/archetipi-oggetti/:id", async (req, res) => {
  await db.query("DELETE FROM archetipi_oggetti WHERE id = ?", [req.params.id]);
  res.json({ message: "Archetipo oggetto eliminato" });
});

// Spawn NPC
app.post("/api/spawn-npc", async (req, res) => {
  try {
    const { id, mappa_id } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const [npcData] = await db.query("SELECT * FROM npc WHERE id = ?", [id]);
    if (npcData.length === 0) return res.status(404).json({ message: "NPC non trovato" });

    const { nome, immagine } = npcData[0];

    const [existing] = await db.query(
      "SELECT * FROM tokens WHERE categoria = 'npc' AND fatherid = ?",
      [id]
    );

    if (existing.length > 0) {
      await db.query("UPDATE tokens SET mappa_id = ? WHERE id = ?", [mappa_id, existing[0].id]);
      const [updated] = await db.query("SELECT * FROM tokens WHERE id = ?", [existing[0].id]);
      return res.json(updated[0]);
    } else {
      const [result] = await db.query(
        `INSERT INTO tokens (nome, immagine, mappa_id, categoria, posizione_x, posizione_y, proprietario_id, fatherid)
         VALUES (?, ?, ?, 'npc', 0, 0, ?, ?)`,
        [nome, immagine, mappa_id, "DM", id]
      );
      const [nuovo] = await db.query("SELECT * FROM tokens WHERE id = ?", [result.insertId]);
      res.json(nuovo[0]);
    }
  } catch (err) {
    console.error("Errore spawn NPC:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Spawn Transizioni
app.post("/api/spawn-transizione", async (req, res) => {
  try {
    const { id, mappa_id } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const [transData] = await db.query("SELECT * FROM transizioni WHERE id = ?", [id]);
    if (transData.length === 0) return res.status(404).json({ message: "Transizione non trovata" });

    const { nome, immagine } = transData[0];

    const [existing] = await db.query(
      "SELECT * FROM tokens WHERE categoria = 'transizione' AND fatherid = ?",
      [id]
    );

    if (existing.length > 0) {
      await db.query("UPDATE tokens SET mappa_id = ? WHERE id = ?", [mappa_id, existing[0].id]);
      const [updated] = await db.query("SELECT * FROM tokens WHERE id = ?", [existing[0].id]);
      return res.json(updated[0]);
    } else {
      const [result] = await db.query(
        `INSERT INTO tokens (nome, immagine, mappa_id, categoria, posizione_x, posizione_y, proprietario_id, fatherid)
         VALUES (?, ?, ?, 'transizione', 0, 0, ?, ?)`,
        [nome, immagine, mappa_id, "DM", id]
      );
      const [nuovo] = await db.query("SELECT * FROM tokens WHERE id = ?", [result.insertId]);
      res.json(nuovo[0]);
    }
  } catch (err) {
    console.error("Errore spawn transizione:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Visualizza tokens filtrati per categoria
app.get("/api/tokens-filtrati", async (req, res) => {
  try {
    const categorie = req.query.categorie; // comma-separated string
    if (!categorie) return res.status(400).json({ message: "Nessuna categoria specificata" });

    const categorieArray = categorie.split(",");
    const placeholders = categorieArray.map(() => "?").join(",");
    const [rows] = await db.query(`SELECT * FROM tokens WHERE categoria IN (${placeholders})`, categorieArray);

    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero token filtrati:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Cancella un token
app.delete("/api/token/:id", async (req, res) => {
  try {
    const tokenId = req.params.id;
    await db.query("DELETE FROM tokens WHERE id = ?", [tokenId]);
    res.json({ message: "Token eliminato" });
  } catch (error) {
    console.error("Errore nella cancellazione token:", error);
    res.status(500).json({ error: "Errore del server" });
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

// Configurazione multer per tokens
const storageToken = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/tokens"); // Cartella dove salvare i token
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rinomina il file con timestamp
  }
});

// Configurazione middleware upload tokens
const upload = multer({
  storage: storageToken,
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

// Caricare immagine token PG
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


// Configurazione multer per mappe
const storageMappe = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/mappe/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Configurazione middleware upload mappe
const uploadMappa = multer({ storage: storageMappe });

// Caricamento immagine mappa.
app.post("/api/carica-mappa", uploadMappa.single("immagine"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    const utente_id = decoded.id;

    const [rows] = await db.query("SELECT is_dm FROM utenti WHERE id = ?", [utente_id]);
    if (!rows[0]?.is_dm) return res.status(403).json({ message: "Accesso negato" });

    const nome = req.body.nome;
    const immagine = req.file.filename;

    await db.query("INSERT INTO mappe (nome, immagine) VALUES (?, ?)", [nome, immagine]);
    res.status(201).json({ message: "Mappa caricata con successo" });

  } catch (error) {
    console.error("Errore nel caricamento mappa:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Recupero dati mappa
app.get("/api/mappe/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM mappe WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Mappa non trovata" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Errore nel recupero mappa:", error);
    res.status(500).json({ error: error.message });
  }
});

// Configurazione multer spawners
const uploadMulter = multer({ storage: storageToken });
const uploadArchetipo = uploadMulter.single("immagine");

// Caricamento archetipo mob
app.post("/api/nuovo-archetipo-mob", uploadArchetipo, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const nome = req.body.nome;
    const immagine = req.file.filename;

    await db.query(`INSERT INTO archetipi_mob (nome, immagine) VALUES (?, ?)`, [nome, immagine]);
    res.status(201).json({ message: "Archetipo creato con successo" });
  } catch (error) {
    console.error(`Errore /api/nuovo-archetipo-mob:`, error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Caricamento archetipo oggetto
app.post("/api/nuovo-archetipo-oggetto", uploadArchetipo, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const nome = req.body.nome;
    const immagine = req.file.filename;

    await db.query(`INSERT INTO archetipi_oggetti (nome, immagine) VALUES (?, ?)`, [nome, immagine]);
    res.status(201).json({ message: "Archetipo creato con successo" });
  } catch (error) {
    console.error(`Errore /api/nuovo-archetipo-oggetto:`, error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Caricamento NPC
app.post("/api/nuovo-npc", uploadArchetipo, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const nome = req.body.nome;
    const immagine = req.file.filename;

    await db.query(`INSERT INTO npc (nome, immagine) VALUES (?, ?)`, [nome, immagine]);
    res.status(201).json({ message: "Archetipo creato con successo" });
  } catch (error) {
    console.error(`Errore /api/nuovo-npc:`, error);
    res.status(500).json({ error: "Errore del server" });
  }
});

//Caricamento transizione
app.post("/api/nuova-transizione", uploadArchetipo, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const nome = req.body.nome;
    const immagine = req.file.filename;

    await db.query(`INSERT INTO transizioni (nome, immagine) VALUES (?, ?)`, [nome, immagine]);
    res.status(201).json({ message: "Archetipo creato con successo" });
  } catch (error) {
    console.error(`Errore /api/nuovo-archetipo-mob:`, error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Recupero destinazione transizioni
app.get("/api/transizioni/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transizioni WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Transizione non trovata" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Errore transizione:", err);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Recupera un token transizione in base al fatherid (mapref)
app.get("/api/token-transizione-da-mapref/:mapref", async (req, res) => {
  try {
    const { mapref } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM tokens WHERE categoria = 'transizione' AND fatherid = ?",
      [mapref]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Token transizione di destinazione non trovato" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Errore nella ricerca del token transizione:", err);
    res.status(500).json({ message: "Errore del server" });
  }
});

// Cambio mappa token
app.patch("/api/token/:id/cambia-mappa", async (req, res) => {
  try {
    const { nuova_mappa_id, nuova_posizione_x, nuova_posizione_y } = req.body;
    const tokenUtente = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(tokenUtente, "supersegreto");

    const tokenId = req.params.id;

    const [rows] = await db.query("SELECT * FROM tokens WHERE id = ? AND categoria = 'personaggio'", [tokenId]);
    if (rows.length === 0) return res.status(403).json({ message: "Token non trovato o non valido" });

    // Check se l'utente è il proprietario
    if (rows[0].proprietario_id !== decoded.username && !decoded.is_dm)
      return res.status(403).json({ message: "Non autorizzato" });

    await db.query(
      "UPDATE tokens SET mappa_id = ?, posizione_x = ?, posizione_y = ? WHERE id = ?",
      [nuova_mappa_id, nuova_posizione_x, nuova_posizione_y, tokenId]
    );

    res.json({ message: "Mappa e posizione aggiornate" });
  } catch (err) {
    console.error("Errore cambio mappa:", err);
    res.status(500).json({ message: "Errore del server" });
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