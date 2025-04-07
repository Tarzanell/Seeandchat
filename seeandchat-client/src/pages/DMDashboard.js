import { useNavigate } from "react-router-dom";

function DMDashboard() {
  const navigate = useNavigate();

  return (
    <>
    <div>
      <h1>DM Dashboard</h1>
      <h2>Per giocare</h2>
      <button style={{ display: "block", marginBottom: "10px" }} onClick={() => navigate("/characters")}>🎭 Visualizza Personaggi</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <h2>Strumenti DM</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => navigate("/carica-mappa")}>🗺️ Carica Mappa</button>
      <button onClick={() => navigate("/visualizza-mappe")}>👁️ Visualizza Mappe</button>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
      <button onClick={() => navigate("/nuovo-archetipo-mob")}>Nuovo Mob</button>
      <button onClick={() => navigate("/nuovo-archetipo-oggetto")}>Nuovo Oggetto</button>
      <button onClick={() => navigate("/nuovo-npc")}>Nuovo NPC</button>
      <button onClick={() => navigate("/nuova-transizione")}>Nuova Transizione</button>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
      <button onClick={() => navigate("/visualizza-archetipi")}>Visualizza Archetipi</button>
      <button onClick={() => navigate("/visualizza-tokens")}>Visualizza Tokens</button>
      <button onClick={() => navigate("/visualizza-transizioni")}>Visualizza Transizioni</button>
      </div>
    </div>
    </>
  );
}

export default DMDashboard;