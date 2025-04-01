import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function CharacterDetails() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`http://217.154.16.188:3001/api/personaggi/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(`Errore HTTP! Status: ${response.status}`);

        const data = await response.json();
        setCharacter(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p>Errore: {error}</p>;
  if (!character) return <p>Personaggio non trovato.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{character.nome}</h2>
      {character.immagine && <img src={`http://217.154.16.188:3001/uploads/tokens/${character.immagine}`} alt="ritratto" width={150} />}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Attributi */}
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <h3>Attributi</h3>
          <p>FOR: {character.forza} | {character.bFOR}</p>
          <p>DES: {character.destrezza} | {character.bDES}</p>
          <p>COS: {character.costituzione} | {character.bCOS}</p>
          <p>INT: {character.INTELLIGENZA} | {character.bINT}</p>
          <p>SAG: {character.SAGGEZZA} | {character.bSAG}</p>
          <p>CHA: {character.CARISMA} | {character.bCHA}</p>
        </div>

        {/* Tiri Salvezza */}
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <h3>Tiri Salvezza</h3>
          <p>*FOR: {character.tsFOR ? "✓" : "X"} | {character.btsFOR}</p>
          <p>*DES: {character.tsDES ? "✓" : "X"} | {character.btsDES}</p>
          <p>*COS: {character.tsCOS ? "✓" : "X"} | {character.btsCOS}</p>
          <p>*INT: {character.tsINT ? "✓" : "X"} | {character.btsINT}</p>
          <p>*SAG: {character.tsSAG ? "✓" : "X"} | {character.btsSAG}</p>
          <p>*CHA: {character.tsCHA ? "✓" : "X"} | {character.btsCHA}</p>
        </div>

      

        <div
        style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1px solid black",
            padding: "10px",
            gap: "5px",
        }}
>
  <h3 style={{ gridColumn: "1 / -1" }}>Abilità e Bonus</h3>

  {[
    ["acrobazia", "bacrobazia"],
    ["addestrare_animali", "baddestrare"],
    ["arcano", "barcano"],
    ["atletica", "batletica"],
    ["ingannare", "bingannare"],
    ["furtivita", "bfurtivita"],
    ["indagare", "bindagare"],
    ["intuizione", "bintuizione"],
    ["intrattenere", "bintrattenere"],
    ["intimidire", "bintimidire"],
    ["medicina", "bmedicina"],
    ["natura", "bnatura"],
    ["percezione", "bpercezione"],
    ["persuasione", "bpersuasione"],
    ["religione", "breligione"],
    ["rapidita_di_mano", "brapidita"],
    ["sopravvivenza", "bsopravvivenza"],
    ["storia", "bstoria"],
  ].map(([abilita, bonus]) => (
    <React.Fragment key={abilita}>
      <div>|{character[abilita] ? "✓" : "X"}| {abilita}</div>
      <div>{character[bonus]}</div>
    </React.Fragment>
  ))}
</div>

        {/* Combattimento */}
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <h3>Combattimento</h3>
          <p>CA: {character.CA}</p>
          <p>*Iniziativa: {character.iniziativa}</p>
          <p>Velocità: {character.velocita_in_metri || character.velocita}</p>
          <p>Ispirazione: {character.ispirazione ? "✓" : ""}</p>
          <p>Bonus competenza: +{character.bonus_competenza}</p>
        </div>

        {/* Punti Ferita e Dadi Vita */}
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <h3>Punti Ferita</h3>
          <p>Massimi: {character.pfmax}</p>
          <p>Attuali: {character.pfatt}</p>
          <p>Temporanei: {character.pftemp}</p>

          <h4>Dadi Vita</h4>
          <p>DV: {character.dv} / {character.dvmax} (usati: {character.dvatt})</p>
        </div>

        {/* Monete */}
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <h3>Monete</h3>
          <p>Rame: {character.mr}</p>
          <p>Argento: {character.ma}</p>
          <p>Oro: {character.mo}</p>
          <p>Platino: {character.mp}</p>
        </div>

        {/* Info generali */}
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <h3>Informazioni</h3>
          <p>Razza: {character.razza}</p>
          <p>Classe: {character.classe}</p>
          <p>Età: {character.eta}</p>
          <p>Altezza: {character.altezza}</p>
          <p>Peso: {character.peso}</p>
          <p>BG approvato: {character.BGapproved ? "Si" : "No"}</p>
        </div>
      </div>

      {/* Descrizione e Background */}
      <div style={{ marginTop: "20px", border: "1px solid black", padding: "10px" }}>
        <h3>Descrizione</h3>
        <p>{character.descrizione || "Nessuna"}</p>
      </div>

      <div style={{ marginTop: "20px", border: "1px solid black", padding: "10px" }}>
        <h3>Background</h3>
        <p>{character.BG || "Nessuno"}</p>
      </div>

      <div style={{ marginTop: "20px", border: "1px solid black", padding: "10px" }}>
        <h3>Note</h3>
        <p>{character.note || "Nessuna"}</p>
      </div>
    </div>
  );
}

export default CharacterDetails;
