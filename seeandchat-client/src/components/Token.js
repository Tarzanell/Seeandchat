// file in src/pages/
import React, { useEffect, useState } from "react";
import { useDrag } from "react-dnd";
import dragPreviewImg from "../assets/token_drag_preview.png";

function Token({ token, characterToken, positionStyle, character, userId, isDm, setTokens, mapWidth, mapHeight, dragStartPos, setDragStartPos, mousePos, setMousePos, isCombat, remainingMovement, setRemainingMovement, velocity }) {

  const [showOpzioni, setShowOpzioni] = useState(false);
  const [showDescrizione, setShowDescrizione] = useState(false);
  const [descrizione, setDescrizione] = useState("");

  const fetchDescrizione = async () => {
    try {
      const res = await fetch(`http://217.154.16.188:3001/api/personaggio-da-token/${token.id}`);
      const data = await res.json();
      if (res.ok) {
        setDescrizione(data.descrizione);
        setShowDescrizione(true);
      } else {
        alert("Descrizione non trovata.");
      }
    } catch (err) {
      console.error("Errore fetch descrizione:", err);
    }
  }; 

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.body._lastKnownMouseEvent = e;
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let animationFrame;
    const updateMouse = () => {
      const mapElement = document.getElementById("mappa");
      const e = document.body._lastKnownMouseEvent;
      if (mapElement && e) {
        const rect = mapElement.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
      animationFrame = requestAnimationFrame(updateMouse);
    };

    if (dragStartPos) {
      animationFrame = requestAnimationFrame(updateMouse);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [dragStartPos]);

  const [{ isDragging }, drag] = useDrag({
    type: "TOKEN",
    canDrag: !token.isInvisible,
    item: () => {
      setDragStartPos({
        x: token.posizione_x * 50 + 25,
        y: token.posizione_y * 50 + 25,
      });
      return { id: token.id };
    },
    end: async (item, monitor) => {
      setDragStartPos(null);
      setMousePos(null);
      const offset = monitor.getDifferenceFromInitialOffset();
      if (!offset) return;

      const dx = offset.x;
      const dy = offset.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      const deltaX = Math.round(dx / 50);
      const deltaY = Math.round(dy / 50);
      const newX = Math.max(0, Math.min(mapWidth - 1, token.posizione_x + deltaX));
      const newY = Math.max(0, Math.min(mapHeight - 1, token.posizione_y + deltaY));

      /*console.log("Id proprietario Token:",token.proprietario_id);
      console.log("Id di chi sta toccando:",userId);*/
      
      if (token.proprietario_id != userId && !isDm) return;

      const movementCost = magnitude;
      if (isCombat && remainingMovement !== null && movementCost > remainingMovement) {
        alert("Hai finito il movimento per questo turno.");
        return;
      }
        console.log("isCombat:", isCombat);
      if (isCombat) {
        setRemainingMovement(prev => Math.max(0, prev - movementCost));
        console.log("Movimento rimanente:", Math.round(remainingMovement/50));
      }

      try {
        const authToken = localStorage.getItem("token");
        console.log("Token id spostato:", token.id);
        await fetch(`http://217.154.16.188:3001/api/token/${token.id}/posizione`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ posizione_x: newX, posizione_y: newY }),
        });

        setTokens(prevTokens =>
          prevTokens.map(t =>
            t.id === token.id ? { ...t, posizione_x: newX, posizione_y: newY } : t
          )
        );
      } catch (err) {
        console.error("Errore nell'aggiornamento posizione:", err);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleClick = async () => {
    console.log("", token.isInvisible);
    if (token.isInvisible) return;
    if (showOpzioni || showDescrizione) return;
    if (token.categoria === "personaggio") {
      setShowOpzioni(true);
    }

    if (token.categoria !== "transizione" || !characterToken) return;

    if (token.nome === "Escidallimbo") {
      const authToken = localStorage.getItem("token");
      try {
        console.log("characterToken:", characterToken.id);
        await fetch(`http://217.154.16.188:3001/api/exitlimbo/${characterToken.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        alert("Sei uscito dal limbo.");
        window.location.reload();
        return;
      } catch (err) {
        console.error("Errore uscita dal limbo:", err);
        alert("Errore durante l'uscita dal limbo.");
        return;
      }
    }

    if (token.categoria === "transizione") {
      const dx = (token.posizione_x - characterToken.posizione_x) * 50;
      const dy = (token.posizione_y - characterToken.posizione_y) * 50;
      const distanza = Math.sqrt(dx * dx + dy * dy);
      if (distanza > 50) return;

      const conferma = window.confirm("Vuoi attraversare questa transizione?");
      if (!conferma) return;

      try {
        const resTrans = await fetch(`http://217.154.16.188:3001/api/transizioni/${token.fatherid}`);
        const data = await resTrans.json();
        const targetFatherId = data.mapref;

        if (!targetFatherId) {
          alert("Questa transizione non è collegata a nulla.");
          return;
        }

        const resTokenTarget = await fetch(`http://217.154.16.188:3001/api/token-transizione-da-mapref/${targetFatherId}`);
        if (!resTokenTarget.ok) {
          alert("Transizione di destinazione non trovata.");
          return;
        }

        const tokenTarget = await resTokenTarget.json();

        const authToken = localStorage.getItem("token");
        await fetch(`http://217.154.16.188:3001/api/token/${characterToken.id}/cambia-mappa`, {
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
    }
  };

  return (
    <>
      <div
        ref={drag}
        className="token"
        style={{
          display: token.isInvisible ? "none" : "block",
          position: "absolute",
          width: "50px",
          height: "50px",
          backgroundImage: `url(http://217.154.16.188:3001/uploads/tokens/${token.immagine})`,
          backgroundSize: "cover",
          cursor: "pointer",
          opacity: isDragging ? 0.3 : 1,
          ...positionStyle,
          zIndex: 10,
        }}
        onClick={token.isInvisible ? undefined : handleClick}
      >
        {showOpzioni && (
          <div className="popup-opzioni" style={{ position: "absolute", top: "60px", left: 0, backgroundColor: "white", padding: "10px", border: "1px solid black", zIndex: 100 }}>
            <p><strong>{token.nome}</strong></p>
            <button onClick={() => { setShowOpzioni(false); fetchDescrizione(); }}>Osserva</button><br />
            <button onClick={() => alert("Scambia - non implementato")}>Scambia</button><br />
            <button onClick={() => alert("Placeholder")}>Placeholder</button><br />
            <button onClick={() => alert("Placeholder")}>Placeholder</button><br />
            <button onClick={() => setShowOpzioni(false)}>Chiudi</button>
          </div>
        )}

        {showDescrizione && (
          <div className="popup-descrizione" style={{ position: "absolute", top: "60px", left: 0, backgroundColor: "#eee", padding: "10px", border: "1px solid black", zIndex: 101 }}>
            <p><strong>Descrizione:</strong></p>
            <p style={{ whiteSpace: "pre-wrap" }}>{descrizione || "Nessuna descrizione disponibile."}</p>
            <button onClick={() => setShowDescrizione(false)}>Chiudi</button>
          </div>
        )}
      </div>
    </>
  );
}

export default Token;