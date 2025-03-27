import { useState } from "react";
import { useNavigate } from "react-router-dom";

function NuovaTransizione({ }) {
  const [nome, setNome] = useState("");
  const [immagine, setImmagine] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("immagine", immagine);

    const response = await fetch(`http://217.154.16.188:3001/api/nuova-transizione`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.ok) {
      alert(`Transizione caricata con successo`);
      navigate("/dmdashboard");
    } else {
      alert("Errore nel caricamento.");
    }
  };

  return (
    <div>
      <h2>Nuova Transizione</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <input type="file" accept="image/*" onChange={(e) => setImmagine(e.target.files[0])} required />
        <button type="submit">Carica</button>
      </form>
    </div>
  );
}

export default NuovaTransizione;