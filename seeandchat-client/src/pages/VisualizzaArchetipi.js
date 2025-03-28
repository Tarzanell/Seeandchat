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
        const dataMob = await resMob.json();
        setArchetipiMob(dataMob);
      }

      if (mostraOggetti) {
        const resOggetti = await fetch("http://217.154.16.188:3001/api/archetipi-oggetti", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataOggetti = await resOggetti.json();
        setArchetipiOggetti(dataOggetti);
      }
    };

    fetchDati();
  }, [mostraMob, mostraOggetti]);

  return (
    <div>
      <h2>Visualizza Archetipi</h2>

      <label>
        <input type="checkbox" checked={mostraMob} onChange={() => setMostraMob(!mostraMob)} />
        Mostra Mob
      </label>

      <label>
        <input type="checkbox" checked={mostraOggetti} onChange={() => setMostraOggetti(!mostraOggetti)} />
        Mostra Oggetti
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {mostraMob &&
          archetipiMob.map((mob) => (
            <div key={`mob-${mob.id}`} style={{ border: "1px solid black", padding: "10px" }}>
              <h4>{mob.nome}</h4>
              <img src={`http://217.154.16.188:3001/uploads/tokens/${mob.immagine}`} alt={mob.nome} width="80" />
            </div>
          ))}

        {mostraOggetti &&
          archetipiOggetti.map((ogg) => (
            <div key={`ogg-${ogg.id}`} style={{ border: "1px solid black", padding: "10px" }}>
              <h4>{ogg.nome}</h4>
              <img src={`http://217.154.16.188:3001/uploads/tokens/${ogg.immagine}`} alt={ogg.nome} width="80" />
            </div>
          ))}
      </div>
    </div>
  );
}

export default VisualizzaArchetipi;