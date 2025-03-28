import React, { useState, useEffect } from "react";

function ChatBox({ character, mioToken }) {
  const [messaggi, setMessaggi] = useState([]);
  const [testo, setTesto] = useState("");
  const [voce, setVoce] = useState("Parlando");
  const [linguaggio, setLinguaggio] = useState("Comune");

  const caricaMessaggi = async () => {
    try {
      const res = await fetch(`http://217.154.16.188:3001/api/chat/${mioToken.mappa_id}/${mioToken.id}`);
      const data = await res.json();
      setMessaggi(data);
    } catch (err) {
      console.error("Errore nel recupero chat:", err);
    }
  };

  useEffect(() => {
    caricaMessaggi();
    const intervallo = setInterval(caricaMessaggi, 5000); // ogni 5 secondi
    return () => clearInterval(intervallo);
  }, [mioToken.mappa_id, mioToken.id]);

  const inviaMessaggio = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://217.154.16.188:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          testo,
          mappa_id: mioToken.mappa_id,
          nome_personaggio: character.nome,
          voce,
          linguaggio
        })
      });

      if (res.ok) {
        setTesto("");
        caricaMessaggi(); // aggiorna subito
      } else {
        alert("Errore nell'invio del messaggio.");
      }
    } catch (err) {
      console.error("Errore invio messaggio:", err);
    }
  };

  return (
    <div style={{ marginTop: "10px", background: "#eee", padding: "10px", borderTop: "1px solid #ccc", maxHeight: "300px", overflowY: "auto" }}>
      <h4>Chat di mappa</h4>

      <div style={{ maxHeight: "150px", overflowY: "scroll", marginBottom: "10px", border: "1px solid gray", padding: "5px", backgroundColor: "white" }}>
        {messaggi.map(msg => (
          <div key={msg.id}><strong>{msg.nome_personaggio}</strong>: {msg.contenuto}</div>
        ))}
      </div>

      <form onSubmit={inviaMessaggio}>
        <div>
          <select value={voce} onChange={(e) => setVoce(e.target.value)}>
            <option>Urlando</option>
            <option>Parlando</option>
            <option>Sussurrando</option>
          </select>

          <select value={linguaggio} onChange={(e) => setLinguaggio(e.target.value)} style={{ marginLeft: "5px" }}>
            <option>Comune</option>
            <option>Elfico</option>
            <option>Nano</option>
            {/* puoi aggiungere altri */}
          </select>
        </div>

        <textarea
          maxLength={1000}
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          rows={3}
          style={{ width: "100%", marginTop: "5px" }}
        />

        <button type="submit">Invia</button>
      </form>
    </div>
  );
}

export default ChatBox;