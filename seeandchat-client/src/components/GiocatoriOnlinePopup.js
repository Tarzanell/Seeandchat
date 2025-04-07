import React, { useEffect, useState } from "react";

function GiocatoriOnlinePopup() {
  const [utenti, setUtenti] = useState([]);
  const [tokens, setTokens] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resUtenti = await fetch("http://217.154.16.188:3001/api/allutenti", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const utentiData = await resUtenti.json();

        const resTokens = await fetch("http://217.154.16.188:3001/api/allchartokens", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tokensData = await resTokens.json();
        setUtenti(utentiData);
        setTokens(tokensData);
      } catch (err) {
        console.error("Errore nel fetch di utenti o token:", err);
      }
    };
    console.log("Characters:",tokens);
    fetchData();
  }, []);

  const now = Date.now();
  const CINQUE_MINUTI = 5 * 60 * 1000;

  const renderUtente = (utente) => {
    const isOnline = now - new Date(utente.ultimo_ping).getTime() < CINQUE_MINUTI;
    const tokenPg = tokens.find(t => t.fatherid == utente.lastPg);

    return (
      <div key={utente.id} style={{ border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
        <strong>{utente.username}</strong> - {isOnline ? "Online" : "Offline"}
        {isOnline && tokenPg && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
            <img
              src={`http://217.154.16.188:3001/uploads/tokens/${tokenPg.immagine}`}
              alt="Anteprima token"
              style={{ width: "50px", height: "50px", objectFit: "cover" }}
            />
            <span>{tokenPg.nome}</span>
            <button>Invia missiva</button>
            <button>Messaggio privato</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", top: "10%", left: "10%", right: "10%", bottom: "10%", background: "white", border: "2px solid black", overflowY: "auto", padding: "20px", zIndex: 9999 }}>
      <h3>Giocatori Online</h3>
      {utenti.map(renderUtente)}
    </div>
  );
}

export default GiocatoriOnlinePopup;
