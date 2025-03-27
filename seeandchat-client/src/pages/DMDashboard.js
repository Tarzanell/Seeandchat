import { useNavigate } from "react-router-dom";

function DMDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>DM Dashboard</h2>
      <button onClick={() => navigate("/characters")}>🎭 Seleziona Personaggio</button>
      <button onClick={() => navigate("/carica-mappa")}>🗺️ Carica Mappa</button>
      <button onClick={() => navigate("/visualizza-mappe")}>👁️ Visualizza Mappe</button>
      <button onClick={() => navigate("/nuovo-spawn")}>➕ Nuovo Spawn</button>
      <button onClick={() => navigate("/nuovo-archetipo-mob")}>Nuovo Mob</button>
<button onClick={() => navigate("/nuovo-archetipo-oggetto")}>Nuovo Oggetto</button>
<button onClick={() => navigate("/nuovo-npc")}>Nuovo NPC</button>
<button onClick={() => navigate("/nuova-transizione")}>Nuova Transizione</button>
    </div>
  );
}

export default DMDashboard;