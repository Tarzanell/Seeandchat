import { useState } from "react";
import { useNavigate } from "react-router-dom";

function NewCharacter({ onCharacterAdded }) {
  const [formData, setFormData] = useState({
    nome: "Nome",
    velocita: 500,
    forza: 10,
    destrezza: 10,
    costituzione: 10,
    punti_vita: 100,
    token_img: "",
  });

  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = parseInt(value, 10) || 0;

    // Controllo per forza, destrezza e costituzione (max 15)
    if (["forza", "destrezza", "costituzione"].includes(name) && newValue > 15) {
      newValue = 15;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    let imageName = "";
    if (file) {
      const formDataImg = new FormData();
      formDataImg.append("token", file);

      const imgResponse = await fetch("http://217.154.16.188:3001/api/upload", {
        method: "POST",
        body: formDataImg,
      });

      const imgData = await imgResponse.json();
      if (imgResponse.ok) {
        imageName = imgData.filename;
      } else {
        alert("Errore nel caricamento dell'immagine.");
        return;
      }
    }

    const response = await fetch("http://217.154.16.188:3001/api/aggiungi-personaggio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...formData, token_img: imageName }),
    });

    if (response.ok) {
      alert("Personaggio aggiunto!");
      navigate("/characters");
    } else {
      alert("Errore nella creazione del personaggio.");
    }
  };

  return (
    <div>
      <h2>Nuovo Personaggio</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleNameChange} required />
        <input type="number" name="forza" value={formData.forza} onChange={handleChange} required />
        <input type="number" name="destrezza" value={formData.destrezza} onChange={handleChange} required />
        <input type="number" name="costituzione" value={formData.costituzione} onChange={handleChange} required />
        <input type="number" name="punti_vita" value={formData.punti_vita} onChange={handleChange} required />
        <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} required />
        <button type="submit">Crea</button>
      </form>
    </div>
  );
}

export default NewCharacter;