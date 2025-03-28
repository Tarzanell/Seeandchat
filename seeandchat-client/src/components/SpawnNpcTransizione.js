import { useEffect, useState } from "react";

function SpawnNpcTransizione({ mappaId, setTokens }) {
  const [npc, setNpc] = useState([]);
  const [transizioni, setTransizioni] = useState([]);
  const [selezionato, setSelezionato] = useState({ tipo: "", id: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resNpc = await fetch("http://217.154.16.188:3001/api/npc", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resTrans = await fetch("http://217.154.16.188:3001/api/transizioni", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNpc(await resNpc.json());
        setTransizioni(await resTrans.json());
      } catch (err) {
        console.error("Errore nel recupero NPC/Transizioni:", err);
      }
    };
    fetchData();
  }, []);

  const handleSpawn = async () => {
    const { tipo, id } = selezionato;
    if (!tipo || !id) return;

    try {
      const res = await fetch(`http://217.154.16.188:3001/api/spawn-${tipo}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, mappa_id: mappaId }),
      });

      if (res.ok) {
        const nuovoToken = await res.json();
        setTokens((prev) =>
          [...prev.filter(t => t.categoria !== tipo || t.id !== nuovoToken.id), nuovoToken]
        );
        alert(`${tipo} spawnato!`);
      } else {
        alert("Errore nello spawn.");
      }
    } catch (err) {
      console.error("Errore nella chiamata API di spawn:", err);
      alert("Errore di rete.");
    }
  };

  return (
    <div style={{
      position: "absolute",
      top: "50px",
      right: "10px",
      zIndex: 10,
      background: "#eee",
      padding: "10px",
      border: "1px solid black",
      borderRadius: "5px"
    }}>
      <h4>Spawn NPC / Transizione</h4>

      {/* Primo dropdown: seleziona tipo */}
      <select
        value={selezionato.tipo}
        onChange={(e) => setSelezionato({ tipo: e.target.value, id: "" })}
      >
        <option value="">-- Seleziona Categoria --</option>
        <option value="npc">NPC</option>
        <option value="transizione">Transizione</option>
      </select>

      {/* Secondo dropdown: seleziona ID */}
      {selezionato.tipo && (
        <select
          value={selezionato.id}
          onChange={(e) =>
            setSelezionato((prev) => ({ ...prev, id: e.target.value }))
          }
        >
          <option value="">-- Seleziona {selezionato.tipo} --</option>
          {(selezionato.tipo === "npc" ? npc : transizioni).map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
      )}

      {/* Bottone di conferma */}
      {selezionato.id && (
        <button onClick={handleSpawn} style={{ marginTop: "5px" }}>
          Spawn
        </button>
      )}
    </div>
  );
}

export default SpawnNpcTransizione;