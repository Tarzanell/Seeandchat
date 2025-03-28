import { useEffect, useState } from "react";

function VisualizzaTokens() {
  const [tokens, setTokens] = useState([]);
  const [filtro, setFiltro] = useState({
    mob: true,
    oggetto: true,
    npc: true,
    transizione: true,
    personaggio: false,
  });

  useEffect(() => {
    const fetchDati = async () => {
      const token = localStorage.getItem("token");
      const categorieAttive = Object.entries(filtro)
        .filter(([_, attivo]) => attivo)
        .map(([categoria]) => categoria);

      if (categorieAttive.length === 0) {
        setTokens([]);
        return;
      }

      const res = await fetch(`http://217.154.16.188:3001/api/tokens-filtrati?categorie=${categorieAttive.join(",")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setTokens(data);
    };

    fetchDati();
  }, [filtro]);

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://217.154.16.188:3001/api/token/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      alert("Token eliminato");
      setTokens(tokens.filter(t => t.id !== id));
    } else {
      alert("Errore nella cancellazione");
    }
  };

  return (
    <div>
      <h2>Visualizza Tokens</h2>
      <label><input type="checkbox" checked={filtro.mob} onChange={() => setFiltro({ ...filtro, mob: !filtro.mob })} /> Mob</label>
      <label><input type="checkbox" checked={filtro.oggetto} onChange={() => setFiltro({ ...filtro, oggetto: !filtro.oggetto })} /> Oggetto</label>
      <label><input type="checkbox" checked={filtro.npc} onChange={() => setFiltro({ ...filtro, npc: !filtro.npc })} /> NPC</label>
      <label><input type="checkbox" checked={filtro.transizione} onChange={() => setFiltro({ ...filtro, transizione: !filtro.transizione })} /> Transizione</label>
      <label><input type="checkbox" checked={filtro.personaggio} onChange={() => setFiltro({ ...filtro, personaggio: !filtro.personaggio })} /> Personaggio</label>

      <ul>
        {tokens.map(t => (
          <li key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={`http://217.154.16.188:3001/uploads/tokens/${t.immagine}`} alt={t.nome} width="50" height="50" />
            <span>{t.nome || "(senza nome)"}</span>
            <span style={{ fontStyle: "italic", fontSize: "0.9em" }}>{t.categoria}</span>
            <button onClick={() => handleDelete(t.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VisualizzaTokens;