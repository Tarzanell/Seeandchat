import React from "react";
import { useDrag } from "react-dnd";

function Token({ token, positionStyle, character, userId, isDm, setTokens }) {
  const [{ isDragging }, drag] = useDrag({
    type: "TOKEN",
    item: { id: token.id },
    end: async (item, monitor) => {
      const offset = monitor.getDifferenceFromInitialOffset();
      if (!offset) return;

      const Vmax = character.velocita;

      const deltaX = Math.round(offset.x / 50);
      const deltaY = Math.round(offset.y / 50);
      const newX = Math.max(0, Math.min(9, token.posizione_x + deltaX));
      const newY = Math.max(0, Math.min(9, token.posizione_y + deltaY));
      /*console.log("posxvecchia:", token.posizione_x);
      console.log("offsetx:", offset.x);
      console.log("newposx:", newX);
      console.log("posybecchia:", token.posizione_y);
      console.log("offsety:", offset.y);
      console.log("newposy:", newY);
      console.log("idToken:", token.id);*/
      console.log("Velocità:", Vmax);
      
      
        

      // 🔒 Solo se sei il proprietario o un DM puoi spostare
      if (token.proprietario_id !== userId && !isDm) return;
      if (offset.x > 200)
        {alert("Slow down baby."); return;} 
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
        src={`http://217.154.16.188:3001/uploads/tokens/${token.immagine}`}
        alt="Token"
        style={{ width: "50px", height: "50px" }}
      />
    </div>
  );
}

export default Token;