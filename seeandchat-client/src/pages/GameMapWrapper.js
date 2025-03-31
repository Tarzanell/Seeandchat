import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GameMap from "./GameMap";

function GameMapWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  const character = location.state?.character;
  const userId = location.state?.userId;
  const isDm = location.state?.isDm;

  const [mioToken, setMioToken] = useState(null);

  // Evita return condizionale
  useEffect(() => {
    if (!character) {
      navigate("/characters");
    }
  }, [character, navigate]);

  // Polling: se cambia mappa, ricarica
  useEffect(() => {
    if (!mioToken) return;

    const token = localStorage.getItem("token");

    const controllaMappa = async () => {
      try {
        const res = await fetch(`http://217.154.16.188:3001/api/token/${mioToken.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.mappa_id !== mioToken.mappa_id) {
            console.log("Cambio mappa rilevato. Ricarico pagina...");
            setMioToken(data);
          }
        }
      } catch (err) {
        console.error("Errore nel polling mappa:", err);
      }
    };

    const intervallo = setInterval(controllaMappa, 10000);
    return () => clearInterval(intervallo);
  }, [mioToken]);

  if (!character) return null;

  return (
    <GameMap
    character={character}
    userId={userId}
    isDm={isDm}
    mioToken={mioToken} // ← AGGIUNGI QUESTO
    setMioToken={setMioToken}
  />
  );
}

export default GameMapWrapper;