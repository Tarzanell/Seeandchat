import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Characters() {
  const [characters, setCharacters] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCharacters(); // 🔹 Carica i personaggi all'avvio
  }, []);

  const fetchCharacters = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("http://217.154.16.188:3001/api/listapersonaggi", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) {
      setCharacters(data);
    } else {
      alert("Errore nel recupero dei personaggi.");
    }
  };

  // 🔥 Funzione per cancellare un personaggio
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://217.154.16.188:3001/api/personaggi/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      alert("Personaggio eliminato!");
      setCharacters(characters.filter((char) => char.id !== id)); // 🔹 Aggiorna la lista dopo la cancellazione
    } else {
      alert("Errore nella cancellazione del personaggio.");
    }
  };

  return (
    <div>
      <h2>Seleziona un personaggio</h2>
{characters.length > 0 ? (
  <ul>
    {characters.map((char) => (
      <li key={char.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* 🔹 Mostra l'immagine del personaggio se esiste */}
        {char.token_img && (
          <img
            src={`http://217.154.16.188:3001/uploads/${char.token_img}`}
            alt={char.nome}
            width="50"
            height="50"
            style={{ borderRadius: "5px" }}
          />
        )}

        {/* 🔹 Nome del personaggio con navigazione ai dettagli */}
        <span onClick={() => navigate(`/character/${char.id}`)} style={{ cursor: "pointer", flex: 1 }}>
          {char.nome}
        </span>

        {/* 🔹 Bottone per cancellare il personaggio */}
        <button onClick={() => handleDelete(char.id)}>❌ Cancella</button>
      </li>
    ))}
  </ul>
) : (
  <p>Nessun personaggio trovato.</p>
)}
      
      {/* 🔹 Tasto per creare un nuovo personaggio */}
      <button onClick={() => navigate("/new-character")}>➕ Nuovo Personaggio</button>
    </div>
  );
}

export default Characters;