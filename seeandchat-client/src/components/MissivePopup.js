import React, { useEffect, useState } from "react";

function MissivePopup({ mioToken}) {
  const [missive, setMissive] = useState([]);
  const [selezionata, setSelezionata] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMissive = async () => {
      try {
        const res = await fetch(`http://217.154.16.188:3001/api/missive/${mioToken.fatherid}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        setMissive(data);
      } catch (err) {
        console.error("Errore nel fetch delle missive:", err);
      }
    };

    fetchMissive();
  }, [mioToken.fatherid]);

  const segnaComeLetta = async (id) => {
    try {
      await fetch(`http://217.154.16.188:3001/api/missive/${id}/segna-letta`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMissive(prev =>
        prev.map(m => m.id === id ? { ...m, isRead: 1 } : m)
      );
    } catch (err) {
      console.error("Errore nel segnalare come letta:", err);
    }
  };

  const handleLeggi = (m) => {
    setSelezionata(m);
    if (!m.isRead) segnaComeLetta(m.id);
  };

  return (
    <div style={{ position: "fixed", top: "10%", left: "10%", right: "10%", bottom: "10%", background: "white", border: "2px solid black", padding: "20px", overflowY: "auto", zIndex: 9999 }}>
      <h3>Missive</h3>
      

      {!selezionata ? (
        <>
          {missive.map(m => (
            <div key={m.id} style={{ border: "1px solid gray", padding: "10px", marginBottom: "10px", backgroundColor: m.isRead ? "#f5f5f5" : "#fffbe6" }}>
              <strong>Da:</strong> {m.mittente_nome} <strong>A:</strong> {m.destinatario_nome}<br />
              <strong>Titolo:</strong> {m.titolo || "(senza titolo)"}<br />
              <button onClick={() => handleLeggi(m)}>Leggi</button>
            </div>
          ))}
        </>
      ) : (
        <div style={{ border: "1px solid black", padding: "20px" }}>
          <h4>Missiva da <span style={{ color: "purple" }}>{selezionata.mittente_nome}</span> a <span style={{ color: "purple" }}>{selezionata.destinatario_nome}</span></h4>
          <p><strong>Titolo:</strong> {selezionata.titolo || "(senza titolo)"}</p>
          <p><strong>Luogo:</strong> {selezionata.locazione}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{selezionata.testo}</p>
          <button onClick={() => setSelezionata(null)}>Torna alla lista</button>
        </div>
      )}
    </div>
  );
}

export default MissivePopup;