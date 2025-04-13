const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const app = express();
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");


app.use(cors());
app.use(express.json());
app.use('/uploads', cors(), express.static('uploads'));

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
app.get("/api/listapersonaggidm", async (req, res) => {
  try {
    console.log("Inizio ricerca personaggi");
    const [result] = await db.query("SELECT * FROM personaggi");
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Nessun personaggio trovato." });
    }

    res.json(result);
  } catch (err) {
    console.error("Errore nel database:", err);
    res.status(500).send({ error: "Errore nel database" });
  }
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

    const utente_is_dm = decoded.is_dm;

    // 🔸 Controlla che l'ID del personaggio sia numerico (per evitare SQL injection)
    const personaggio_id = parseInt(req.params.id, 10);
    if (isNaN(personaggio_id)) {
      console.error("❌ ID personaggio non valido:", req.params.id);
      return res.status(400).json({ error: "ID personaggio non valido" });
    }
    console.log("🔹 ID PG richiesto:", personaggio_id);


    if(!utente_is_dm){
    // 🔹 Cerca il personaggio per ID e verifica che appartenga all'utente loggato
      const [rows] = await db.query("SELECT * FROM personaggi WHERE id = ? AND utente_id = ?", [personaggio_id, utente_id]);
      
      if (rows.length === 0) {
        console.warn("⚠️ Nessun personaggio trovato con ID:", personaggio_id, "per utente ID:", utente_id);
        return res.status(404).json({ message: "Personaggio non trovato" });
      }
      console.log("✅ Personaggio trovato:", rows[0]); 
      res.json(rows[0]); // 🔹 Invia i dettagli del personaggio
      }

    else{
      const [rows] = await db.query("SELECT * FROM personaggi WHERE id = ?", [personaggio_id]);
      if (rows.length === 0) {
        console.warn("⚠️ Nessun personaggio trovato con ID:", personaggio_id, "per utente ID:", utente_id);
        return res.status(404).json({ message: "Personaggio non trovato" });
      }
      console.log("✅ Personaggio trovato:", rows[0]); 
      res.json(rows[0]); // 🔹 Invia i dettagli del personaggio
      } 
    
   
    

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

// Recupera il token associato a un personaggio (via fatherid)
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
    const isOwner = tokenDb.proprietario_id == decoded.id;
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

// Recupera tutti gli utenti
app.get("/api/allutenti", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const [rows] = await db.query("SELECT * FROM utenti");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero Utenti:", error);
    res.status(500).json({ error: "Errore server" });
  }
});

// Recupera tutti i token personaggi
app.get("/api/allchartokens", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token mancante" });

    const decoded = jwt.verify(token, "supersegreto");
    if (!decoded.is_dm) return res.status(403).json({ message: "Non autorizzato" });

    const [rows] = await db.query("SELECT * FROM tokens WHERE categoria = 'personaggio'");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero Utenti:", error);
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

// Lista personaggi con id
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

/*
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
*/

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

// Configurazione multer portraits
const dynamicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "portrait") {
      cb(null, "./uploads/portraits");
    } else {
      cb(null, "./uploads/tokens");
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: dynamicStorage });

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

// Nuovo NPC
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

//Nuova transizione
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
    console.error(`Errore /api/nuova-transizione:`, error);
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

// Modifica transizioni
app.patch("/api/transizioni/:id", async (req, res) => {
  const { nome, immagine, mapref } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM transizioni WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Transizione non trovata" });

    const campi = [];
    const valori = [];

    if (nome !== undefined && nome !== null) {
      campi.push("nome = ?");
      valori.push(nome);
    }
    if (immagine !== undefined && immagine !== null) {
      campi.push("immagine = ?");
      valori.push(immagine);
    }
    if (mapref !== undefined && mapref !== null) {
      campi.push("mapref = ?");
      valori.push(mapref);
    }

    if (campi.length === 0) {
      return res.status(400).json({ message: "Nessun campo da aggiornare" });
    }

    const query = `UPDATE transizioni SET ${campi.join(", ")} WHERE id = ?`;
    valori.push(req.params.id);

    await db.query(query, valori);
    res.json({ message: "Transizione aggiornata con successo" });
  } catch (err) {
    console.error("Errore aggiornamento transizione:", err);
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
    if (rows[0].proprietario_id != decoded.id && !decoded.is_dm)
      return res.status(403).json({ message: "Non autorizzato" });

    await db.query(
      "UPDATE tokens SET mappa_id = ?, last_mapId = ?, posizione_x = ?, posizione_y = ? WHERE id = ?",
      [nuova_mappa_id, nuova_mappa_id, nuova_posizione_x, nuova_posizione_y, tokenId]
    );

    res.json({ message: "Mappa e posizione aggiornate" });
  } catch (err) {
    console.error("Errore cambio mappa:", err);
    res.status(500).json({ message: "Errore del server" });
  }
});

// Esci dal limbo
app.patch("/api/exitlimbo/:token_id", async (req, res) => {
  try {
    const tokenId = req.params.token_id;
    const tokenUtente = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(tokenUtente, "supersegreto");

    const [rows] = await db.query("SELECT * FROM tokens WHERE id = ? AND categoria = 'personaggio'", [tokenId]);
    if (rows.length === 0) return res.status(404).json({ message: "Token non trovato" });

    const token = rows[0];

    if (token.proprietario_id != decoded.id && !decoded.is_dm)
      return res.status(403).json({ message: "Non autorizzato" });

    await db.query(
      `UPDATE tokens SET mappa_id = ?, posizione_x = ?, posizione_y = ? WHERE id = ?`,
      [token.last_mapId, token.lastpos_x, token.lastpos_y, tokenId]
    );

    res.json({ message: "Uscita dal limbo completata" });
  } catch (err) {
    console.error("Errore uscita dal limbo:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

//Ricezione messaggi per personaggioo
app.get("/api/chat/:mappa_id/:token_id", async (req, res) => {
  try {
    const mappa_id = parseInt(req.params.mappa_id);
    const token_id = parseInt(req.params.token_id);

    //Mette in mioToken il proprio token
    const [tokenRows] = await db.query(
      "SELECT * FROM tokens WHERE id = ?", [token_id]);
    if (tokenRows.length === 0) return res.status(404).json({ error: "Token non trovato" });

    const mioToken = tokenRows[0];

    //Mette in chatrows tutti i messaggi inviati nella mappa
    const [chatRows] = await db.query(
      `SELECT * FROM chat 
       WHERE mappa_id = ? 
         AND timestamp >= NOW() - INTERVAL 5 SECOND
       ORDER BY timestamp ASC`,
      [mappa_id]
    );

    //Mette in tokenChat tutti i token presenti in mappa e registra posizione
    const [tokenChat] = await db.query(
      "SELECT id, nome, posizione_x, posizione_y FROM tokens WHERE mappa_id = ?",
      [mappa_id]
    );

    const tokenMap = Object.fromEntries(tokenChat.map(t => [t.nome, t]));

    const messaggiCensurati = chatRows.map(msg => {
      console.log("Nome mittente:",msg.nome_personaggio);
      if (msg.nome_personaggio.includes("DM"))
        { 
          return {
            id: msg.id,
            nome_personaggio: msg.nome_personaggio,
            voce: msg.voce,
            linguaggio: msg.linguaggio,
            contenuto: msg.messaggio,
            timestamp: msg.timestamp,
            nome_mappa: msg.nome_mappa,
          };}

      else
      {
      const mittenteToken = tokenMap[msg.nome_personaggio];
      if (!mittenteToken) {
        return { ...msg, contenuto: "*mittente non trovato*" };
      }

      const dx = (mittenteToken.posizione_x - mioToken.posizione_x) * 50;
      const dy = (mittenteToken.posizione_y - mioToken.posizione_y) * 50;
      const distanza = Math.sqrt(dx * dx + dy * dy);

      let contenuto = msg.messaggio;

      if (msg.voce === "Sussurrando" && distanza > 50) {
        contenuto = contenuto.replace(/<[^>]+>/g, "*parla a voce troppo bassa*");
      } else if (msg.voce === "Parlando" && distanza > 150) {
        contenuto = contenuto.replace(/<[^>]+>/g, "*Troppo lontano per sentire*");
      } 

      return {
        id: msg.id,
        nome_personaggio: msg.nome_personaggio,
        voce: msg.voce,
        linguaggio: msg.linguaggio,
        contenuto,
        timestamp: msg.timestamp,
        nome_mappa: msg.nome_mappa,
      };}
    });

    // Debug (opzionale)
    const logsDaSalvare = messaggiCensurati.map(msg => {
      return `[${msg.timestamp}] ${msg.nome_personaggio} in ${mappa_id}: ${msg.contenuto}`;
    });
    

    // ⚠️ Scegli solo uno dei due blocchi qui sotto:

    // ✅ OPZIONE 1: SALVA SOLO L’ULTIMO MESSAGGIO
    /*const ultimo = messaggiCensurati[messaggiCensurati.length - 1];
    if (ultimo) {
      await db.query(
        "INSERT INTO chat_logs (personaggio_id, timestamp, mittente, mappa_id, messaggio) VALUES (?, ?, ?, ?, ?)",
        [mioToken.fatherid, ultimo.timestamp, ultimo.nome_personaggio, mappa_id, ultimo.contenuto]
      );
    }*/

    // ✅ OPZIONE 2: SALVA SOLO I NON-DUPLICATI (commenta la 1 se usi questa)
    
    for (const msg of messaggiCensurati) {
      const [esiste] = await db.query(
        "SELECT id FROM chat_logs WHERE personaggio_id = ? AND timestamp = ? AND mittente = ? AND messaggio = ?",
        [mioToken.fatherid, msg.timestamp, msg.nome_personaggio, msg.contenuto]
      );

      if (esiste.length === 0) {
        await db.query(
          "INSERT INTO chat_logs (personaggio_id, timestamp, mittente, mappa_id, messaggio, nome_mappa) VALUES (?, ?, ?, ?, ?, ?)",
          [mioToken.fatherid, msg.timestamp, msg.nome_personaggio, mappa_id, msg.contenuto, msg.nome_mappa]
        );
      }
    }
    

    res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Errore nel recupero chat censurata:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// Visualizzazione messaggi
app.get("/api/chat-log/:personaggio_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM chat_logs WHERE personaggio_id = ? ORDER BY timestamp ASC",
      [req.params.personaggio_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Errore nel recupero chat log:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// Invio in db chat base e msg privati.
app.post("/api/chat/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");

    const { testo, mappa_id, nome_personaggio, voce, linguaggio, mapNome } = req.body;

    if (!testo || testo.length > 1000) {
      return res.status(400).json({ error: "Messaggio vuoto o troppo lungo" });
    }


    if (testo.toLowerCase().startsWith("/p ")) {
      const regex = /^\/p\s+(\S+)\s+(.+)/i;
      const match = testo.match(regex);
    
      if (!match) {
        return res.status(400).json({ error: "Sintassi messaggio privato non valida. Usa: /p NomePersonaggio messaggio" });
      }
    
      const destinatarioNome = match[1];
      const messaggio = match[2];
    
      // Cerca destinatario
      const [rows] = await db.query(
        "SELECT id FROM personaggi WHERE nome = ? LIMIT 1",
        [destinatarioNome]
      );
    
      if (rows.length === 0) {
        return res.status(404).json({ error: "Personaggio destinatario non trovato" });
      }
    
      const destinatarioId = rows[0].id;
    
      await db.query(
        "INSERT INTO chat_logs (personaggio_id, timestamp, mittente, mappa_id, messaggio, nome_mappa) VALUES (?, NOW(), ?, 999, ?, 'Messaggio Privato')",
        [destinatarioId, nome_personaggio, messaggio]
      );

      const [mittenteRows] = await db.query(
        "SELECT id FROM personaggi WHERE nome = ? LIMIT 1",
        [nome_personaggio]
      );
      
      if (mittenteRows.length > 0) {
        const mittenteId = mittenteRows[0].id;
        const messaggioConNota = ` a ${destinatarioNome} - ${messaggio}`;
      
        await db.query(
          "INSERT INTO chat_logs (personaggio_id, timestamp, mittente, mappa_id, messaggio, nome_mappa) VALUES (?, NOW(), ?, 999, ?, 'Messaggio Privato')",
          [mittenteId, nome_personaggio, messaggioConNota]
        );
      }
    
      return res.status(201).json({ message: "Messaggio privato inviato" });
    }

    // 1. Inserisci il messaggio del personaggio in chat
    else{
    await db.query(
      "INSERT INTO chat (messaggio, mappa_id, nome_personaggio, voce, linguaggio, timestamp, nome_mappa) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
      [testo, mappa_id, nome_personaggio, voce, linguaggio, mapNome]
    );
  

    // 2. Controlla la frase chiave (case insensitive)
    if (testo.toLowerCase().includes("mi chiedo cosa pensino gli dei")) {
      try {
        const [mapResult] = await db.query("SELECT descrizione_chatgpt, nome FROM mappe WHERE id = ?", [mappa_id]);
        if (!mapResult.length) return res.status(404).json({ error: "Mappa non trovata" });

        const descrizioneMappa = mapResult[0].descrizione_chatgpt;
        const nomeMappa = mapResult[0].nome;

        // Recupera ultimi 2 messaggi dalla mappa
        const [chatRows] = await db.query(
          "SELECT messaggio FROM chat WHERE mappa_id = ? ORDER BY timestamp DESC LIMIT 2",
          [mappa_id]
        );

        const ultimiMessaggi = chatRows.reverse().map(row => row.messaggio); // ordine cronologico

        const istruzioni = `Tu sei la voce degli dei. Rispondi in modo criptico, vago e inquietante. Parla con autorità ma senza essere diretto. Puoi usare metafore, domande retoriche o visioni.`

        const prompt = `
${istruzioni}

Descrizione mappa:
${descrizioneMappa}

Ultimi messaggi:
${ultimiMessaggi.map((msg, i) => `Messaggio ${i + 1}: ${msg}`).join("\n")}
`;

        // Inserisci la risposta fittizia di ChatGPT nella chat
        await db.query(
          "INSERT INTO chat (messaggio, mappa_id, nome_personaggio, voce, linguaggio, timestamp, nome_mappa) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
          [prompt, mappa_id, "DMChatgpt", "urlando", "comune", nomeMappa]
        );
      } catch (err) {
        console.error("Errore nella generazione del messaggio degli dei:", err);
      }
    }
  }

    res.status(201).json({ message: "Messaggio inviato" });
  } catch (err) {
    console.error("Errore nell'invio del messaggio:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// Invio in db chat base + api chatgpt vecchie
/*
// Invio messaggi in DB chat
app.post("/api/chat/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");

    const { testo, mappa_id, nome_personaggio, voce, linguaggio, mapNome } = req.body;

    if (!testo || testo.length > 1000) {
      return res.status(400).json({ error: "Messaggio vuoto o troppo lungo" });
    }

    await db.query(
      "INSERT INTO chat (messaggio, mappa_id, nome_personaggio, voce, linguaggio, timestamp, nome_mappa) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
      [testo, mappa_id, nome_personaggio, voce, linguaggio, mapNome]
    );

    res.status(201).json({ message: "Messaggio inviato" });
  } catch (err) {
    console.error("Errore nell'invio del messaggio:", err);
    res.status(500).json({ error: "Errore server" });
  }
});


// Risposte chatgpt
app.post("/api/chatgpt", async (req, res) => {
  const { istruzioni, mappa_id, chat } = req.body;

  try {
    const [mapResult] = await db.query("SELECT descrizione_chatgpt FROM mappe WHERE id = ?", [mappa_id]);
    if (!mapResult.length) return res.status(404).json({ error: "Mappa non trovata" });

    const descrizioneMappa = mapResult[0].descrizione_chatgpt;
    const mapNome = mapResult[0].nome;
    const prompt = `
${istruzioni}

Descrizione mappa:
${descrizioneMappa}

Ultimi messaggi:
${chat.map((msg, i) => `Messaggio ${i + 1}: ${msg}`).join("\n")}
`;

    // CHIAMATA A CHATGPT (mock)
    // const gptResponse = await fetchOpenAI(prompt);
    //const gptResponse = { risposta: "Risposta simulata da ChatGPT:", prompt };
    //res.json({ risposta: gptResponse });
  
    await db.query(
      "INSERT INTO chat (messaggio, mappa_id, nome_personaggio, voce, linguaggio, timestamp, nome_mappa) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
      [prompt, mappa_id, "Chatgpt", "urlando", "comune", mapNome]
    );

  } 
  catch (err) {
    console.error("Errore API ChatGPT:", err);
    res.status(500).json({ error: "Errore del server" });
  }
});
*/

// Invio missive
app.post("/api/inviomissive", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");
    
    const {
      mittente_id,
      mittente_nome,
      destinatario_nome,
      testo,
      locazione
    } = req.body;


    const [rows] = await db.query(
      "SELECT id FROM personaggi WHERE nome = ? LIMIT 1",
      [destinatario_nome]
    );
  
    if (rows.length === 0) {
      return res.status(404).json({ error: "Personaggio destinatario non trovato" });
    }
   
    const destinatario_id = rows[0].id;

    if (!mittente_id || !mittente_nome || !destinatario_id || !destinatario_nome || !testo || !locazione) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    await db.query(
      `INSERT INTO missive 
      (mittente_id, mittente_nome, destinatario_id, destinatario_nome, testo, locazione, isRead) 
      VALUES (?, ?, ?, ?, ?, ?, false)`,
      [mittente_id, mittente_nome, destinatario_id, destinatario_nome, testo, locazione]
    );

    res.status(201).json({ message: "Missiva inviata" });
  } catch (err) {
    console.error("Errore invio missiva:", err);
    res.status(500).json({ error: "Errore server" });
  }
});


// Recupero missive
app.get("/api/missive/:personaggio_id", async (req, res) => {
  try {
    const personaggio_id = parseInt(req.params.personaggio_id);

    if (isNaN(personaggio_id)) {
      return res.status(400).json({ error: "ID non valido" });
    }

    const [rows] = await db.query(
      `SELECT * FROM missive 
       WHERE mittente_id = ? OR destinatario_id = ? 
       ORDER BY timestamp DESC`,
      [personaggio_id, personaggio_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Errore recupero missive:", err);
    res.status(500).json({ error: "Errore server" });
  }
});


// Nuovo Personaggio
app.post("/api/personaggi", upload.fields([
  { name: "immagineToken", maxCount: 1 },
  { name: "portrait", maxCount: 1 }
]), async (req, res) => {
  
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");

    const formData = JSON.parse(req.body.formData);
    const filename = req.files["immagineToken"]?.[0]?.filename || null;
    const portraitFilename = req.files["portrait"]?.[0]?.filename || null;

    const abilitaFlags = {
      acrobazia: 0,
      addestrare_animali: 0,
      arcano: 0,
      atletica: 0,
      ingannare: 0,
      furtivita: 0,
      indagare: 0,
      intuizione: 0,
      intrattenere: 0,
      intimidire: 0,
      medicina: 0,
      natura: 0,
      percezione: 0,
      persuasione: 0,
      religione: 0,
      rapidita_di_mano: 0,
      sopravvivenza: 0,
      storia: 0,
    };
    
    (formData.abilita || []).forEach(ab => {
      if (ab in abilitaFlags) abilitaFlags[ab] = 1;
    });

    const bonus = calcolaBonusPersonaggio(formData, abilitaFlags);
    
    formData.pfmax += bonus.bCOS;
    formData.pfatt = formData.pfmax;
    


    // Inserisci personaggio
    const [result] = await db.query(
      `INSERT INTO personaggi (
        nome, eta, altezza, peso, razza, classe, descrizione, utente_id,
        \`FOR\`, \`DES\`, \`COS\`, \`INT\`, \`SAG\`, \`CHA\`,
        tsFOR, tsDES, tsCOS, tsINT, tsSAG, tsCHA,
        CA, iniziativa, velocita, velocita_in_metri,
        pfmax, pfatt, pftemp,
        dv, dvmax, dvatt,
        mr, ma, mo, mp,
        bonus_competenza, ispirazione,
        acrobazia, addestrare_animali, arcano, atletica, ingannare, furtivita,
        indagare, intuizione, intrattenere, intimidire, medicina, natura,
        percezione, persuasione, religione, rapidita_di_mano, sopravvivenza, storia,
        bFOR, bDES, bCOS, bINT, bSAG, bCHA,
        btsFOR, btsDES, btsCOS, btsINT, btsSAG, btsCHA,
        bacrobazia, baddestrare_animali, barcano, batletica, bingannare, bfurtivita,
        bindagare, bintuizione, bintrattenere, bintimidire, bmedicina, bnatura,
        bpercezione, bpersuasione, breligione, brapidita_di_mano, bsopravvivenza, bstoria,
        biniziativa,
        token_img, immagine, utente_nome
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        formData.nome,
        formData.eta,
        formData.altezza,
        formData.peso,
        formData.razza,
        formData.classe,
        formData.descrizione || "",
        decoded.id,
        formData.stats.FOR,
        formData.stats.DES,
        formData.stats.COS,
        formData.stats.INT,
        formData.stats.SAG,
        formData.stats.CHA,
        formData.tsFOR || false,
        formData.tsDES || false,
        formData.tsCOS || false,
        formData.tsINT || false,
        formData.tsSAG || false,
        formData.tsCHA || false,
        formData.CA || 10,
        formData.iniziativa || 0,
        formData.velocita || 450,
        formData.velocita_in_metri || 9,
        formData.pfmax || 10,
        formData.pfatt || formData.pfmax || 10,
        formData.pftemp || 0,
        formData.dv || 1,
        formData.dvmax || 1,
        formData.dvatt || 1,
        formData.mr || 0,
        formData.ma || 0,
        formData.mo || 200,
        formData.mp || 0,
        formData.bonus_competenza || 2,
        formData.ispirazione || false,
        abilitaFlags.acrobazia || 0,
        abilitaFlags.addestrare_animali || 0,
        abilitaFlags.arcano || 0,
        abilitaFlags.atletica || 0,
        abilitaFlags.ingannare || 0,
        abilitaFlags.furtivita || 0,
        abilitaFlags.indagare || 0,
        abilitaFlags.intuizione || 0,
        abilitaFlags.intrattenere || 0,
        abilitaFlags.intimidire || 0,
        abilitaFlags.medicina || 0,
        abilitaFlags.natura || 0,
        abilitaFlags.percezione || 0,
        abilitaFlags.persuasione || 0,
        abilitaFlags.religione || 0,
        abilitaFlags.rapidita_di_mano || 0,
        abilitaFlags.sopravvivenza || 0,
        abilitaFlags.storia || 0,
        bonus.bFOR || 0,
        bonus.bDES || 0,
        bonus.bCOS || 0,
        bonus.bINT || 0,
        bonus.bSAG || 0,
        bonus.bCHA || 0,
        bonus.btsFOR || 0,
        bonus.btsDES || 0,
        bonus.btsCOS || 0,
        bonus.btsINT || 0,
        bonus.btsSAG || 0,
        bonus.btsCHA || 0,
        bonus.bacrobazia || 0,
        bonus.baddestrare_animali || 0,
        bonus.barcano || 0,
        bonus.batletica || 0,
        bonus.bingannare || 0,
        bonus.bfurtivita || 0,
        bonus.bindagare || 0,
        bonus.bintuizione || 0,
        bonus.bintrattenere || 0,
        bonus.bintimidire || 0,
        bonus.bmedicina || 0,
        bonus.bnatura || 0,
        bonus.bpercezione || 0,
        bonus.bpersuasione || 0,
        bonus.breligione || 0,
        bonus.brapidita_di_mano || 0,
        bonus.bsopravvivenza || 0,
        bonus.bstoria || 0,
        bonus.biniziativa || 0,
        filename,
        portraitFilename,
        formData.utente_nome,
      ]
    );

    const personaggio_id = result.insertId;

    // Crea token
    await db.query(
      `INSERT INTO tokens (nome, immagine, mappa_id, categoria, proprietario_id, posizione_x, posizione_y, fatherid)
       VALUES (?, ?, ?, 'personaggio', ?, 0, 0, ?)`,
      [formData.nome, filename, 1, decoded.id, personaggio_id]
    );

  
    res.status(201).json({ message: "Personaggio creato" });
  } catch (err) {
    console.error("Errore creazione personaggio:", err);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Ping online
app.get("/api/ping", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");

    await db.query("UPDATE utenti SET ultimo_ping = NOW() WHERE id = ?", [decoded.id]);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Errore nel ping online:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// Recupero token da ID
app.get("/api/token/:id", async (req, res) => {
  try {
    const tokenId = parseInt(req.params.id);
    const [rows] = await db.query("SELECT * FROM tokens WHERE id = ?", [tokenId]);
    if (rows.length === 0) return res.status(404).json({ message: "Token non trovato" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Errore nel recupero token:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// Recupera descrizione da token (via fatherid)
app.get("/api/personaggio-da-token/:token_id", async (req, res) => {
  try {
    const tokenId = req.params.token_id;
    const [tokenRows] = await db.query("SELECT fatherid FROM tokens WHERE id = ?", [tokenId]);
    if (tokenRows.length === 0) return res.status(404).json({ message: "Token non trovato" });

    const fatherId = tokenRows[0].fatherid;
    const [pgRows] = await db.query("SELECT descrizione FROM personaggi WHERE id = ?", [fatherId]);
    if (pgRows.length === 0) return res.status(404).json({ message: "Personaggio non trovato" });

    res.json({ descrizione: pgRows[0].descrizione });
  } catch (err) {
    console.error("Errore nel recupero descrizione:", err);
    res.status(500).json({ message: "Errore del server" });
  }
});

// 🔹 CAMBIA BACKGROUND (descrizione del body sarebbe il nuovo BG)
app.put("/api/personaggi/:id/background", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");

    const { descrizione } = req.body;
    const id = req.params.id;

    const [rows] = await db.query("SELECT utente_id FROM personaggi WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Personaggio non trovato" });

    const proprietario = rows[0].utente_id;
    if (decoded.id != proprietario && !decoded.is_dm) return res.status(403).json({ error: "Accesso negato" });

    await db.query("UPDATE personaggi SET BG = ?, BGapproved = false WHERE id = ?", [descrizione, id]);
    res.status(200).json({ message: "Background aggiornato" });
  } catch (err) {
    console.error("Errore update BG:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// 🔹 CAMBIA DESCRIZIONE
app.put("/api/personaggi/:id/descrizione", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");

    const { descrizione } = req.body;
    const id = req.params.id;

    const [rows] = await db.query("SELECT utente_id FROM personaggi WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Personaggio non trovato" });

    const proprietario = rows[0].utente_id;
    if (decoded.id != proprietario && !decoded.is_dm) return res.status(403).json({ error: "Accesso negato" });

    await db.query("UPDATE personaggi SET descrizione = ? WHERE id = ?", [descrizione, id]);
    res.status(200).json({ message: "Descrizione aggiornata" });
  } catch (err) {
    console.error("Errore update descrizione:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// 🔹 CAMBIA TOKEN
app.put("/api/personaggi/:id/token", upload.single("token"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");
    const id = req.params.id;

    const [rows] = await db.query("SELECT utente_id FROM personaggi WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Personaggio non trovato" });

    const proprietario = rows[0].utente_id;
    if (decoded.id != proprietario && !decoded.is_dm) return res.status(403).json({ error: "Accesso negato" });

    const filename = req.file.filename;
    await db.query("UPDATE personaggi SET token_img = ? WHERE id = ?", [filename, id]);

    // aggiorna anche token
    await db.query("UPDATE tokens SET immagine = ? WHERE categoria = 'personaggio' AND fatherid = ?", [filename, id]);

    res.status(200).json({ message: "Token aggiornato" });
  } catch (err) {
    console.error("Errore update token:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// 🔹 CAMBIA PORTRAIT
app.put("/api/personaggi/:id/portrait", upload.single("portrait"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");
    const id = req.params.id;

    const [rows] = await db.query("SELECT utente_id FROM personaggi WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Personaggio non trovato" });

    const proprietario = rows[0].utente_id;
    if (decoded.id != proprietario && !decoded.is_dm) return res.status(403).json({ error: "Accesso negato" });

    const filename = req.file.filename;
    await db.query("UPDATE personaggi SET immagine = ? WHERE id = ?", [filename, id]);
    res.status(200).json({ message: "Portrait aggiornato" });
  } catch (err) {
    console.error("Errore update portrait:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// Cambio stato BGapproved
app.put("/api/personaggi/:id/bgapproved/:stato", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, "supersegreto");

    if (!decoded.is_dm) {
      return res.status(403).json({ error: "Accesso negato: solo i DM possono modificare lo stato BG." });
    }

    const characterId = req.params.id;
    const stato = req.params.stato.toLowerCase();

    if (stato !== "true" && stato !== "false") {
      return res.status(400).json({ error: "Stato non valido. Usa true o false." });
    }

    const nuovoValore = stato === "true";

    const [result] = await db.query(
      "UPDATE personaggi SET BGapproved = ? WHERE id = ?",
      [nuovoValore, characterId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Personaggio non trovato." });
    }

    res.json({ message: `BGapproved impostato a ${nuovoValore}` });
  } catch (err) {
    console.error("Errore aggiornamento BGapproved:", err);
    res.status(500).json({ error: "Errore del server." });
  }
});

// Set ultimo personaggio per lista utenti
app.patch("/api/utenti/:utenteid/:lastpgid", async (req, res) => {
  const utenteid = req.params.utenteid;
  const lastpgid = req.params.lastpgid;

  try {
    const [userRows] = await db.query("SELECT * FROM utenti WHERE id = ?", [utenteid]);
    if (userRows.length === 0) return res.status(404).json({ message: "Utente non trovato" });

    await db.query("UPDATE utenti SET lastPg = ? WHERE id = ?", [lastpgid, utenteid]);
    res.json({ message: "lastPg aggiornato correttamente" });
  } catch (err) {
    console.error("Errore aggiornamento lastPg:", err);
    res.status(500).json({ error: "Errore del server" });
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


// Spostamento tokens offline nel limbo
async function spostaTokenOfflineNelLimbo() {
  try {
    // Salva la mappa attuale prima di spostare
    await db.query(`
      UPDATE tokens
      SET last_mapId = mappa_id,
          lastpos_x = posizione_x, 
          lastpos_y = posizione_y
      WHERE categoria = 'personaggio'
        AND proprietario_id IN (
          SELECT id FROM utenti
          WHERE ultimo_ping < NOW() - INTERVAL 30 SECOND
        )
        AND mappa_id != 4
    `);

    // Sposta nel limbo
    const [risultato] = await db.query(`
      UPDATE tokens
      SET mappa_id = 4 
      WHERE categoria = 'personaggio'
        AND proprietario_id IN (
          SELECT id FROM utenti
          WHERE ultimo_ping < NOW() - INTERVAL 30 SECOND
        )
    `);

    console.log(`[Limbo] ${risultato.affectedRows} token spostati nel limbo.`);
  } catch (err) {
    console.error("Errore nello spostamento token nel limbo:", err);
  }
}


setInterval(() => {
  spostaTokenOfflineNelLimbo();
  //riportaTokenDalLimbo();
}, 60000); // ogni 60 secondi

//Funzione calcolo bonus
function calcolaBonusPersonaggio(formData, abilitaFlags) {
  const b = {}; // oggetto dove inseriamo tutto

  // Calcolo bonus statistici
  b.bFOR = Math.floor((formData.stats.FOR - 10) / 2);
  b.bDES = Math.floor((formData.stats.DES - 10) / 2);
  b.bCOS = Math.floor((formData.stats.COS - 10) / 2);
  b.bINT = Math.floor((formData.stats.INT - 10) / 2);
  b.bSAG = Math.floor((formData.stats.SAG - 10) / 2);
  b.bCHA = Math.floor((formData.stats.CHA - 10) / 2);

  // Bonus tiri salvezza
  const bonusComp = formData.bonus_competenza || 2;
  b.btsFOR = b.bFOR + bonusComp * (formData.tsFOR ? 1 : 0);
  b.btsDES = b.bDES + bonusComp * (formData.tsDES ? 1 : 0);
  b.btsCOS = b.bCOS + bonusComp * (formData.tsCOS ? 1 : 0);
  b.btsINT = b.bINT + bonusComp * (formData.tsINT ? 1 : 0);
  b.btsSAG = b.bSAG + bonusComp * (formData.tsSAG ? 1 : 0);
  b.btsCHA = b.bCHA + bonusComp * (formData.tsCHA ? 1 : 0);

  // Mappa tra abilità e stat rilevante
  const mappaAbilitaStat = {
    acrobazia: "bDES",
    addestrare_animali: "bSAG",
    arcano: "bINT",
    atletica: "bFOR",
    ingannare: "bCHA",
    furtivita: "bDES",
    indagare: "bINT",
    intuizione: "bSAG",
    intrattenere: "bCHA",
    intimidire: "bCHA",
    medicina: "bSAG",
    natura: "bINT",
    percezione: "bSAG",
    persuasione: "bCHA",
    religione: "bINT",
    rapidita_di_mano: "bDES",
    sopravvivenza: "bSAG",
    storia: "bINT",
  };

  // Calcolo bonus abilità
  for (const [abilita, stat] of Object.entries(mappaAbilitaStat)) {
    const flag = abilitaFlags[abilita] ? 1 : 0;
    b["b" + abilita] = b[stat] + bonusComp * flag;
  }

  // Iniziativa = bonus destrezza
  b.biniziativa = b.bDES;

  return b;
}