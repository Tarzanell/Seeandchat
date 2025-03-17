import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Characters() {
  const [characters, setCharacters] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharacters = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://217.154.16.188:3001/api/personaggi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCharacters(data);
      } else {
        alert("Errore nel recupero dei personaggi.");
      }
    };

    fetchCharacters();
  }, []);

  return (
    <div>
      <h2>Seleziona un personaggio</h2>
      <ul>
        {characters.map((char) => (
          <li key={char.id} onClick={() => navigate(`/character/${char.id}`)}>
            {char.nome}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Characters;