import React from "react";
import { useDrag } from "react-dnd";
import { useEffect } from "react";
import dragPreviewImg from "../assets/token_drag_preview.png";
import { getDragPreviewOffset } from 'react-dnd-html5-backend'; // opzionale




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
      /*console.log("posxvecchia:", token.posizione_x);
      console.log("offsetx:", offset.x);
      console.log("newposx:", newX);
      console.log("posybecchia:", token.posizione_y);
      console.log("offsety:", offset.y);
      console.log("newposy:", newY);
      console.log("idToken:", token.id);
      console.log("Velocità:", Vmax);
      console.log("Movimento:", magnitude);*/
      
      
        

      // 🔒 Solo se sei il proprietario o un DM puoi spostare
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

        // 🔄 Aggiorna stato locale dopo spostamento
        setTokens(prevTokens =>
        prevTokens.map(t =>
        t.id === token.id
        ? { ...t, posizione_x: newX, posizione_y: newY }
        : t
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

    console.log("Click su", token.categoria);
    console.log("Tuo character:", characterToken);
    if (token.categoria !== "transizione" || !characterToken) return;  
    const dx = (token.posizione_x - characterToken.posizione_x) * 50;
    const dy = (token.posizione_y - characterToken.posizione_y) * 50;
    const distanza = Math.sqrt(dx * dx + dy * dy);

    console.log("X target",token.posizione_x);
    console.log("Y target", token.posizione_y);
    console.log("X tuo", characterToken.posizione_x);
    console.log("Y tuo", characterToken.posizione_y);
    console.log("Distanza:", distanza);

    if (distanza > 50) return;
    console.log("Abbastanza vicino");
    const conferma = window.confirm("Vuoi cambiare mappa?");
    if (!conferma) return;
  
    try {
      const res = await fetch(`http://217.154.16.188:3001/api/transizioni/${token.fatherid}`);
      const data = await res.json();
  
      if (!data.mapref) {
        alert("Questa transizione non porta da nessuna parte.");
        return;
      }
  
      const authToken = localStorage.getItem("token");
      await fetch(`http://217.154.16.188:3001/api/token/${characterToken.id}/cambia-mappa`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ nuova_mappa_id: data.mapref }),
      });
  
      alert("Sei stato trasportato nella nuova mappa!");
      window.location.reload();  // oppure aggiorna mappa con useEffect
    } catch (err) {
      console.error("Errore nella transizione:", err);
      alert("Errore nel cambio mappa.");
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