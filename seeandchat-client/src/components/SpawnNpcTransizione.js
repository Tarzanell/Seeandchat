import { useEffect, useState } from "react";

function SpawnNpcTransizione({ mappaId, setTokens }) {
  const [npc, setNpc] = useState([]);
  const [transizioni, setTransizioni] = useState([]);
  const [selezionato, setSelezionato] = useState({ tipo: "", nome: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      const resNpc = await fetch("http://217.154.16.188:3001/api/npc", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resTrans = await fetch("http://217.154.16.188:3001/api/transizioni", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNpc(await resNpc.json());
      setTransizioni(await resTrans.json());
    };
    fetchData();
  }, []);

  const handleSpawn = async () => {
    const tipo = selezionato.tipo;
    const nome = selezionato.nome;

    if (!tipo || !nome) return;

    const res = await fetch(`http://217.154.16.188:3001/api/spawn-${tipo.toLowerCase()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nome, mappa_id: mappaId }),
    });

    if (res.ok) {
      const nuoviToken = await res.json();
      setTokens(prev => [...prev.filter(t => t.categoria !== tipo || t.nome !== nome), nuoviToken]);
      alert(`${tipo} spawnato!`);
    } else {
      alert("Errore nello spawn.");
    }
  };

  return (
    <div style={{ position: "absolute", top: "50px", right: "10px", zIndex: 10, background: "#eee", padding: "10px", border: "1px solid black" }}>
      <h4>Spawn NPC / Transizione</h4>

      <select onChange={(e) => setSelezionato({ tipo: "NPC", nome: e.target.value })}>
        <option value="">-- Seleziona NPC --</option>
        {npc.map(n => <option key={n.id} value={n.nome}>{n.nome}</option>)}
      </select>

      <select onChange={(e) => setSelezionato({ tipo: "Transizione", nome: e.target.value })}>
        <option value="">-- Seleziona Transizione --</option>
        {transizioni.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
      </select>

      <button onClick={handleSpawn}>Spawn</button>
    </div>
  );
}

export default SpawnNpcTransizione;