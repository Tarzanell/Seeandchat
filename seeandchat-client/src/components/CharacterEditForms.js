import React, { useState } from "react";

function CharacterEditForms({ character, tipo, refresh, isDm }) {
  const [file, setFile] = useState(null);
  const [text, setText] = useState(tipo === "descrizione" ? character.descrizione || "" : character.BG || "");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleFileUpload = async (endpoint, fileFieldName) => {
    if (!file) return alert("Seleziona un file prima di inviare.");

    const formData = new FormData();
    formData.append(fileFieldName, file);

    try {
      setLoading(true);
      const res = await fetch(`http://217.154.16.188:3001/api/personaggi/${character.id}/${endpoint}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        refresh();
      } else {
        alert("Errore nell'upload.");
      }
    } catch (err) {
      console.error("Errore upload:", err);
      alert("Errore di rete.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextUpdate = async (campo) => {
    if (campo === "background") {
      const conferma = window.confirm("Questo resetterà l'approvazione del BG. Procedere?");
      if (!conferma) return;
    }

    try {
      setLoading(true);
      const res = await fetch(`http://217.154.16.188:3001/api/personaggi/${character.id}/${campo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ descrizione: text }),
      });

      if (!res.ok) throw new Error();

      // Se è background, chiama anche l’API per disapprovare
      if (campo === "background") {
        await fetch(`http://217.154.16.188:3001/api/personaggi/${character.id}/bgapproved/false`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      refresh();
    } catch (err) {
      console.error("Errore aggiornamento:", err);
      alert("Errore nell'aggiornamento.");
    } finally {
      setLoading(false);
    }
  };


  if (tipo === "token" || tipo === "portrait") {
    return (
      <div>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={() => handleFileUpload(tipo, tipo)} disabled={loading}>
          Cambia {tipo}
        </button>
      </div>
    );
  }

  if (tipo === "descrizione" || tipo === "background") {
    return (
      <div>
        <textarea
          rows={4}
          cols={50}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <br />
        <button onClick={() => handleTextUpdate(tipo)} disabled={loading}>
          Aggiorna {tipo}
        </button>
        
      </div>
    );
  }

  return null;
}

export default CharacterEditForms;