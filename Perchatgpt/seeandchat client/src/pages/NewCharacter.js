import { useState } from "react";

function AddCharacter({ onCharacterAdded }) {
  const [formData, setFormData] = useState({
    nome: "",
    velocita: 500,
    forza: 10,
    destrezza: 10,
    costituzione: 10,
    punti_vita: 100,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = parseInt(value, 10) || 0;

    // Controllo per forza, destrezza e costituzione (max 15)
    if (["forza", "destrezza", "costituzione"].includes(name) && newValue > 15) {
      newValue = 15;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const response = await fetch("http://217.154.16.188:3001/api/aggiungi-personaggio", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert("Personaggio aggiunto!");
      onCharacterAdded(); // Aggiorna la lista
    } else {
      alert("Errore nell'aggiunta del personaggio.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
      <input type="number" name="velocita" placeholder="Velocità" value={formData.velocita} onChange={handleChange} required />
      <input type="number" name="forza" placeholder="Forza (max 15)" value={formData.forza} onChange={handleChange} required />
      <input type="number" name="destrezza" placeholder="Destrezza (max 15)" value={formData.destrezza} onChange={handleChange} required />
      <input type="number" name="costituzione" placeholder="Costituzione (max 15)" value={formData.costituzione} onChange={handleChange} required />
      <input type="number" name="punti_vita" placeholder="Punti Vita" value={formData.punti_vita} onChange={handleChange} required />
      <button type="submit">Aggiungi</button>
    </form>
  );
}

export default AddCharacter;