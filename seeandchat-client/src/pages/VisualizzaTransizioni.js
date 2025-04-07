import React, { useEffect, useState } from "react";

function VisualizzaTransizioni() {
  const [transizioni, setTransizioni] = useState([]);
  const [edit, setEdit] = useState({});
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://217.154.16.188:3001/api/transizioni", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTransizioni(Array.isArray(data) ? data : [data]))
      .catch(console.error);
  }, []);

  const handleChange = (id, campo, valore) => {
    setEdit((prev) => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valore },
    }));
  };

  const handleUpdate = async (id) => {
    const payload = edit[id];
    try {
      const res = await fetch(`http://217.154.16.188:3001/api/transizioni/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Aggiornato");
        window.location.reload();
      } else {
        alert("Errore");
      }
    } catch (err) {
      console.error("Errore aggiornamento:", err);
    }
  };

  return (
    <div>
      <h2>Transizioni</h2>
      {transizioni.map((tr) => {
        const mod = edit[tr.id] || {};
        const maprefDest = transizioni.find((t) => t.id === (mod.mapref ?? tr.mapref));
        return (
          <div key={tr.id} style={{ border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
            <p>ID: {tr.id}</p>
            <label><strong>Nome:</strong></label><br />
            <input
              value={mod.nome ?? tr.nome}
              onChange={(e) => handleChange(tr.id, "nome", e.target.value)}
            />
            <br />
            <label><strong>Anteprima:</strong></label><br />
                <img
                    src={`http://217.154.16.188:3001/uploads/tokens/${mod.immagine ?? tr.immagine}`}
                    alt="Token"
                    style={{ width: "100px", height: "100px", objectFit: "cover", border: "1px solid gray" }}
                />
            <br />
            <label><strong>Immagine:</strong></label><br />
            <input
            value={mod.immagine ?? tr.immagine}
            onChange={(e) => handleChange(tr.id, "immagine", e.target.value)}
            />
            <br />
            <label><strong>MapRef (ID transizione destinazione):</strong></label><br />
            <input
              value={(mod.mapref ?? tr.mapref) || ""}
              onChange={(e) => handleChange(tr.id, "mapref", e.target.value)}
            />
            <p>
              Destinazione: {maprefDest ? maprefDest.nome : "—"}
            </p>
            <button onClick={() => handleUpdate(tr.id)}>Salva</button>
          </div>
        );
      })}
    </div>
  );
}

export default VisualizzaTransizioni;