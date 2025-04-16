import React, { useEffect, useState } from "react";

function MappaGlobale({ mioToken, character, onClose }) {
  const [mapData, setMapData] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [currentMapId, setCurrentMapId] = useState(9);
  const token = localStorage.getItem("token");

  const fetchMapAndTokens = async (mapId) => {
    try {
      const [resMap, resTokens] = await Promise.all([
        fetch(`http://217.154.16.188:3001/api/mappe/${mapId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://217.154.16.188:3001/api/tokens/${mapId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const mapJson = await resMap.json();
      const tokensJson = await resTokens.json();

      setMapData(mapJson);
      setTokens(tokensJson);
    } catch (err) {
      console.error("Errore caricamento mappa globale:", err);
    }
  };

  useEffect(() => {
    fetchMapAndTokens(currentMapId);
  }, [currentMapId]);

  const handleTeleport = async (targetTransId, isZoom) => {
    try {
      const resTrans = await fetch(`http://217.154.16.188:3001/api/transizioni/${targetTransId}`);
      const data = await resTrans.json();
      const targetFatherId = data.mapref;

      if (!targetFatherId) {
        alert("Questa transizione non è collegata a nulla.");
        return;
      }

      if (isZoom) {
        // ricarica la sotto-mappa
        setCurrentMapId(targetFatherId);
        return;
      }

      const conferma = window.confirm("Vuoi attraversare questa transizione?");
      if (!conferma) return;

      const resTokenTarget = await fetch(`http://217.154.16.188:3001/api/token-transizione-da-mapref/${targetFatherId}`);
      if (!resTokenTarget.ok) {
        alert("Transizione di destinazione non trovata.");
        return;
      }

      const tokenTarget = await resTokenTarget.json();

      const authToken = localStorage.getItem("token");
      await fetch(`http://217.154.16.188:3001/api/token/${mioToken.id}/cambia-mappa`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          nuova_mappa_id: tokenTarget.mappa_id,
          nuova_posizione_x: tokenTarget.posizione_x,
          nuova_posizione_y: tokenTarget.posizione_y + 1,
        }),
      });

      alert("Transizione completata.");
      window.location.reload();
    } catch (err) {
      console.error("Errore durante la transizione:", err);
      alert("Errore durante la transizione.");
    }
  };

  if (!mapData) return <p>Caricamento mappa globale...</p>;

  return (
    <div style={{
      position: "fixed",
      top: "10%",
      left: "10%",
      right: "10%",
      bottom: "10%",
      width: `${mapData.larghezza * 30 + 10}px`,
      height: `${mapData.altezza * 30 + 150}px`,
      backgroundColor: "white",
      border: "2px solid black",
      padding: "20px",
      zIndex: 9999,
      overflow: "auto"
    }}>
      <button style={{ float: "right" }} onClick={onClose}>Chiudi</button>
      <h4>Mappa Globale</h4>
      <div style={{
        position: "relative",
        width: `${mapData.larghezza * 30}px`,
        height: `${mapData.altezza * 30}px`,
        backgroundImage: `url(http://217.154.16.188:3001/uploads/mappe/${mapData.immagine})`,
        backgroundSize: "cover",
        marginBottom: "10px",
        border: "1px solid black"
      }}>
        {tokens.map((tok) => {
          const isZoom = tok.nome.toLowerCase().includes("zoom");
          return (
            <div
              key={tok.id}
              onClick={() => handleTeleport(tok.fatherid, isZoom)}
              title={tok.nome}
              style={{
                position: "absolute",
                left: `${tok.posizione_x * 30}px`,
                top: `${tok.posizione_y * 30}px`,
                width: "20px",
                height: "20px",
                backgroundImage: `url(http://217.154.16.188:3001/uploads/tokens/${tok.immagine})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                cursor: "pointer",
                border: "1px solid white"
              }}
            />
          );
        })}
      </div>
      <p>Clicca su una città per teletrasportarti, o su uno Zoom per esplorare meglio la zona.</p>
    </div>
  );
}

export default MappaGlobale;