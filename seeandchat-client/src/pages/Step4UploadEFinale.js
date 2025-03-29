import React, { useState } from "react";

function Step4ConfermaUpload({ formData, onBack }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [esito, setEsito] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Devi selezionare un'immagine per il token.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    const dataToSend = new FormData();
    dataToSend.append("formData", JSON.stringify(formData));
    dataToSend.append("immagineToken", file);

    try {
      const res = await fetch("http://217.154.16.188:3001/api/personaggi", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: dataToSend,
      });

      const resData = await res.json();
      if (res.ok) {
        setEsito("✅ Personaggio creato con successo!");
      } else {
        console.error("Errore:", resData);
        setEsito("❌ Errore nella creazione del personaggio.");
      }
    } catch (err) {
      console.error("Errore invio:", err);
      setEsito("❌ Errore di rete o server.");
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Step 4: Conferma e Carica Immagine</h2>

      <p>Controlla le informazioni, poi scegli un'immagine del token (50x50 consigliato):</p>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      <br /><br />
      <button onClick={onBack}>Indietro</button>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Creazione in corso..." : "Crea Personaggio"}
      </button>

      <p>{esito}</p>
    </div>
  );
}

export default Step4ConfermaUpload;