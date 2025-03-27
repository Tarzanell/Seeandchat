import { useState } from "react";

function NuovoSpawn() {
  const [categoria, setCategoria] = useState("mob");
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("immagine", file);
    formData.append("categoria", categoria);

    const response = await fetch("http://217.154.16.188:3001/api/nuovo-spawn", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.ok) {
      alert("Spawn creato!");
    } else {
      alert("Errore nella creazione.");
    }
  };

  return (
    <div>
      <h2>Nuovo Spawn</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Categoria:
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="mob">mob</option>
            <option value="npc">npc</option>
            <option value="transizione">transizione</option>
            <option value="oggetto">oggetto</option>
          </select>
        </label>
        <br />
        <input type="file" accept="image/png, image/jpeg" onChange={(e) => setFile(e.target.files[0])} required />
        <br />
        <button type="submit">Crea</button>
      </form>
    </div>
  );
}

export default NuovoSpawn;