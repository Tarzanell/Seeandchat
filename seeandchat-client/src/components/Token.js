import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";

function Token({ character, userId, isDm }) {
  const [position, setPosition] = useState({ x: character.pos_x || 0, y: character.pos_y || 0 });

  const canDrag = isDm || character.proprietario_id === userId;

  const [, drag] = useDrag({
    type: "TOKEN",
    item: { type: "TOKEN" },
    canDrag,
  });

  const [, drop] = useDrop({
    accept: "TOKEN",
    drop: (item, monitor) => {
      if (!canDrag) return;

      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;

      const newX = Math.round((position.x * 50 + delta.x) / 50);
      const newY = Math.round((position.y * 50 + delta.y) / 50);

      setPosition({
        x: Math.max(0, Math.min(9, newX)),
        y: Math.max(0, Math.min(9, newY)),
      });

      // (Opzionale) Qui potresti anche fare una chiamata API per salvare il nuovo posizionamento nel DB
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        width: "50px",
        height: "50px",
        position: "absolute",
        left: `${position.x * 50}px`,
        top: `${position.y * 50}px`,
        cursor: canDrag ? "move" : "not-allowed",
      }}
    >
      <img
        src={`http://217.154.16.188:3001/uploads/tokens/${character.token_img}`}
        alt={character.nome}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default Token;