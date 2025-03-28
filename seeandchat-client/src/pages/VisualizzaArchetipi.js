import { useEffect, useState } from "react";

function VisualizzaArchetipi() {
  const [archetipiMob, setArchetipiMob] = useState([]);
  const [archetipiOggetti, setArchetipiOggetti] = useState([]);
  const [mostraMob, setMostraMob] = useState(true);
  const [mostraOggetti, setMostraOggetti] = useState(true);

  useEffect(() => {
    const fetchDati = async () => {
      const token = localStorage.getItem("token");

      if (mostraMob) {
        const resMob = await fetch("http://217.154.16.188:3001/api/archetipi-mob", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resMob.ok) {
          console.error("Errore nel fetch archetipi mob");
        } else {
          const dataMob = await resMob.json();
          setArchetipiMob(dataMob);
        }
      }

      if (mostraOggetti) {
        const resOggetti = await fetch("http://217.154.16.188:3001/api/archetipi-oggetti", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resOggetti.ok) {
          console.error("Errore nel fetch archetipi oggetti");
        } else {
          const dataOggetti = await resOggetti.json();
          setArchetipiOggetti(dataOggetti);
        }
      }
    };

    fetchDati();
  }, [mostraMob, mostraOggetti]);

  const handleDelete = async (tipo, id) => {
    const token = localStorage.getItem("token");
    let endpoint = "";

    if (tipo === "mob") endpoint = `archetipi-mob/${id}`;
    if (tipo === "oggetto") endpoint = `archetipi-oggetti/${id}`;

    const response = await fetch(`http://217.154.16.188:3001/api/${endpoint}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      if (tipo === "mob") setArchetipiMob(archetipiMob.filter((a) => a.id !== id));
      if (tipo === "oggetto") setArchetipiOggetti(archetipiOggetti.filter((a) => a.id !== id));
      alert("Archetipo eliminato");
    } else {
      alert("Errore durante l'eliminazione");
    }
  };

  return (
    <div>
      <h2>Visualizza Archetipi</h2>

      <label>
        <input
          type="checkbox"
          checked={mostraMob}
          onChange={() => setMostraMob(!mostraMob)}
        />
        Mostra Mob
      </label>

      <label style={{ marginLeft: "20px" }}>
        <input
          type="checkbox"
          checked={mostraOggetti}
          onChange={() => setMostraOggetti(!mostraOggetti)}
        />
        Mostra Oggetti
      </label>

      {mostraMob && (
        <div>
          <h3>Archetipi Mob</h3>
          <ul>
            {archetipiMob.map((mob) => (
              <li key={mob.id}>
                <img
                  src={`http://217.154.16.188:3001/uploads/tokens/${mob.immagine}`}
                  alt={mob.nome}
                  width="50"
                  height="50"
                />
                <span style={{ marginLeft: "10px" }}>{mob.nome}</span>
                <button onClick={() => handleDelete("mob", mob.id)} style={{ marginLeft: "10px" }}>
                  ❌ Elimina
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mostraOggetti && (
        <div>
          <h3>Archetipi Oggetti</h3>
          <ul>
            {archetipiOggetti.map((oggetto) => (
              <li key={oggetto.id}>
                <img
                  src={`http://217.154.16.188:3001/uploads/tokens/${oggetto.immagine}`}
                  alt={oggetto.nome}
                  width="50"
                  height="50"
                />
                <span style={{ marginLeft: "10px" }}>{oggetto.nome}</span>
                <button onClick={() => handleDelete("oggetto", oggetto.id)} style={{ marginLeft: "10px" }}>
                  ❌ Elimina
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VisualizzaArchetipi;