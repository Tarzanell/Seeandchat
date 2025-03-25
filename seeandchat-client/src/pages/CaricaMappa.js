// src/pages/CaricaMappa.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CaricaMappa() {
  const [nome, setNome] = useState("");
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!file) {
      alert("Seleziona un file immagine.");
      return;
    }

    const formData = new FormData();
    formData.append("immagine", file);
    formData.append("nome", nome);

    const response = await fetch("http://217.154.16.188:3001/api/carica-mappa", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      alert("Mappa caricata!");
      navigate("/visualizza-mappe");
    } else {
      alert("Errore:", data.message || data.error);
    }
  };

  return (
    <div>
      <h2>Carica una nuova mappa</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome della mappa"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/jpeg, image/png"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button type="submit">Carica</button>
      </form>
    </div>
  );
}

export default CaricaMappa;