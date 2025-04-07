import React, { useState } from "react";

function MiniSchedaTiri({ character, mioToken, mapNome}) {
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
      border: "1px solid black",
      padding: "10px",
      width: "300px",
      marginLeft: "20px"
    }}>
      <h4>Tiri Rapidi</h4>

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
