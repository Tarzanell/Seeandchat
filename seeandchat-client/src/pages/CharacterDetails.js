import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function CharacterDetails() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
    let isDm = false;
    let userId = 0;
  
    if (token) {
      try {
        const decoded = jwtDecode(token);
        isDm = decoded.is_dm;
        userId = decoded.id;
      } catch (error) {
        console.error("Errore nella decodifica del token:", error);
      }
    }



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
    <>
    {/* 🔹 Barra di navigazione fissa */}
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: "#f5f5f5",
      padding: "10px",
      borderBottom: "1px solid #ccc",
      display: "flex",
      gap: "10px",
      zIndex: 1000
    }}>

      {!isDm && <button onClick={() => navigate("/characters")}>Torna ai Personaggi</button>}
      {isDm && <button onClick={() => navigate("/dmdashboard")}>Vai al DM Dashboard</button>}
      <button onClick={() => navigate("/Characters")}> Torna alla selezione dei personaggi</button>
     </div>

    {/* 🔹 Contenuto principale */}
    <div style={{ paddingTop: "40px" }}>
      <h2>{character.nome}</h2>

      <div style={{ display: "flex", gap: "20px", margin: "20px 0" }}>
  
  {character.immagine && (
    <div style={{ border: "4px solid black", padding: "5px", width: "300px", height: "600px", boxSizing: "border-box" }}>
      <img
        src={`http://217.154.16.188:3001/uploads/portraits/${character.immagine}`}
        alt="Portrait"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  )}
  {character.token_img && (
    <div style={{ border: "4px solid black", padding: "5px", width: "200px", height: "200px", boxSizing: "border-box" }}>
      <img
        src={`http://217.154.16.188:3001/uploads/tokens/${character.token_img}`}
        alt="Token"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  )}
</div>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Attributi */}
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <h3>Attributi</h3>
          <p>FOR: {character.FOR} | {character.bFOR}</p>
          <p>DES: {character.DES} | {character.bDES}</p>
          <p>COS: {character.COS} | {character.bCOS}</p>
          <p>INT: {character.INT} | {character.bINT}</p>
          <p>SAG: {character.SAG} | {character.bSAG}</p>
          <p>CHA: {character.CHA} | {character.bCHA}</p>
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
    ["addestrare_animali", "baddestrare_animali"],
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
    ["rapidita_di_mano", "brapidita_di_mano"],
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
          <p>*Iniziativa: {character.biniziativa}</p>
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
    </>
  );
}

export default CharacterDetails;
