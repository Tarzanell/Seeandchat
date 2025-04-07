import React, { useEffect, useState } from "react";

function DmTeletrasporto({ mioToken, isDm, refresh }) {
  const [mappe, setMappe] = useState([]);
  const [mappaSelezionata, setMappaSelezionata] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isDm) return;
    const fetchMappe = async () => {
      try {
        const res = await fetch("http://217.154.16.188:3001/api/tutte-le-mappe", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMappe(data);
        if (data.length > 0) setMappaSelezionata(data[0].id);
      } catch (err) {
        console.error("Errore nel recupero mappe:", err);
      }
    };
    fetchMappe();
  }, [isDm, token]);

  const handleTeletrasporto = async () => {
    if (!mappaSelezionata || !mioToken?.id) return;
    try {
      const res = await fetch(`http://217.154.16.188:3001/api/token/${mioToken.id}/cambia-mappa`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nuova_mappa_id: mappaSelezionata,
          nuova_posizione_x: 0,
          nuova_posizione_y: 0,
        }),
      });

      if (res.ok) {
        alert("Teletrasporto avvenuto con successo");
        if (typeof refresh === "function") refresh();
      } else {
        alert("Errore nel teletrasporto");
      }
      window.location.reload();
    } catch (err) {
      console.error("Errore nella richiesta di teletrasporto:", err);
    }
  };

  if (!isDm) return null;

  return (
    <div style={{
        position: "absolute",
        top: "10px",
        right: "750px",
        zIndex: 10,
        background: "#eee",
        padding: "10px",
        border: "1px solid black",
        borderRadius: "5px"
      }}>

      <h4>Teletrasporto DM</h4>
      <select value={mappaSelezionata} onChange={(e) => setMappaSelezionata(e.target.value)}>
        {mappe.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>
      <button onClick={handleTeletrasporto} style={{ marginLeft: "10px" }}>Teletrasporta</button>
    </div>
  );
}

export default DmTeletrasporto;
