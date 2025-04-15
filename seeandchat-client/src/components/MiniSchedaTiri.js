import React, { useState } from "react";

function MiniSchedaTiri({ character, mioToken, mapNome, onClose }) {
  const [risultato, setRisultato] = useState(null);

  const lanciaDado = async (bonus, nome) => {
    const tiro = Math.floor(Math.random() * 20 + 1);
    const totale = tiro + bonus;
    const messaggio = `Tiro di ${nome} : [d20] ${tiro} + [Bonus] ${bonus} = ${totale}`;
    setRisultato(messaggio);

    try {
      await fetch("http://217.154.16.188:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          testo: messaggio,
          voce: "Urlando",
          linguaggio: "Comune",
          nome_personaggio: character.nome,
          mappa_id: mioToken.mappa_id,
          mapNome,
        }),
      });
    } catch (error) {
      console.error("Errore nell'invio del messaggio in chat:", error);
    }
  };

  const abilita = [
    "acrobazia", "addestrare_animali", "arcano", "atletica", "ingannare", "furtivita",
    "indagare", "intuizione", "intrattenere", "intimidire", "medicina", "natura",
    "percezione", "persuasione", "religione", "rapidita_di_mano", "sopravvivenza", "storia"
  ];

  return (
    <div style={{
      position: "fixed",
      top: "10%",
      right: "10%",
      background: "white",
      border: "2px solid black",
      padding: "20px",
      zIndex: 9999,
      width: "300px",
      maxHeight: "80%",
      overflowY: "auto"
    }}>
      <h4 style={{ marginTop: 0 }}>🎲 Tiri Rapidi</h4>
      <button onClick={onClose} style={{ float: "right", marginTop: "-30px" }}>Chiudi</button>

      <strong>Attributi</strong>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
        {["FOR", "DES", "COS", "INT", "SAG", "CHA"].map(attr => (
          <button key={attr} onClick={() => lanciaDado(character["b" + attr], attr)}>{attr}</button>
        ))}
      </div>

      <strong style={{ marginTop: "10px", display: "block" }}>Tiri Salvezza</strong>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
        {["FOR", "DES", "COS", "INT", "SAG", "CHA"].map(attr => (
          <button key={"ts" + attr} onClick={() => lanciaDado(character["bts" + attr], "TS " + attr)}>TS {attr}</button>
        ))}
      </div>

      <strong style={{ marginTop: "10px", display: "block" }}>Abilità</strong>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
        {abilita.map(ab => (
          <button key={ab} onClick={() => lanciaDado(character["b" + ab], ab)}>{ab}</button>
        ))}
      </div>

      {risultato && (
        <div style={{ marginTop: "15px", fontWeight: "bold" }}>
          🎲 {risultato}
        </div>
      )}
    </div>
  );
}

export default MiniSchedaTiri;