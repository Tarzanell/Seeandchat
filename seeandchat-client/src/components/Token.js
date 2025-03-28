import React, { useEffect } from "react";
import { useDrag } from "react-dnd";
import dragPreviewImg from "../assets/token_drag_preview.png";

function Token({ token, characterToken, positionStyle, character, userId, isDm, setTokens, mapWidth, mapHeight }) {

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: "TOKEN",
    item: { id: token.id },
    end: async (item, monitor) => {
      const offset = monitor.getDifferenceFromInitialOffset();
      if (!offset) return;

      const dx = offset.x;
      const dy = offset.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy);

      const deltaX = Math.round(dx / 50);
      const deltaY = Math.round(dy / 50);
      const newX = Math.max(0, Math.min(mapWidth - 1, token.posizione_x + deltaX));
      const newY = Math.max(0, Math.min(mapHeight - 1, token.posizione_y + deltaY));

      if (token.proprietario_id !== userId && !isDm) return;
      if (magnitude > character.velocita) {
        alert("Slow down baby.");
        return;
      }

      try {
        const authToken = localStorage.getItem("token");
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

  useEffect(() => {
    const img = new Image();
    img.src = dragPreviewImg;
    img.onload = () => {
      dragPreview(img, { captureDraggingState: true });
    };
  }, []);

  const handleClick = async () => {
    if (token.categoria !== "transizione" || !characterToken) return;

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
          nuova_posizione_y: tokenTarget.posizione_y+1,
        }),
      });

      alert("Transizione completata.");
      window.location.reload();
    } catch (err) {
      console.error("Errore durante la transizione:", err);
      alert("Errore durante la transizione.");
    }
  };

  return (
    <div
      ref={drag}
      style={{
        ...positionStyle,
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
        position: "absolute",
      }}
    >
      <img
        onClick={handleClick}
        src={`http://217.154.16.188:3001/uploads/tokens/${token.immagine}`}
        alt="Token"
        style={{ width: "50px", height: "50px" }}
      />
    </div>
  );
}

export default Token;