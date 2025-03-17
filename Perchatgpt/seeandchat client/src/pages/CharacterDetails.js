import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function CharacterDetails() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://217.154.16.188:3001/api/personaggi/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setCharacter(data);
      } else {
        alert("Errore nel caricamento del personaggio.");
      }
    };

    fetchCharacter();
  }, [id]);

  if (!character) return <p>Caricamento...</p>;

  return (
    <div>
      <h2>{character.nome}</h2>
      <p>Velocità: {character.velocita}</p>
      <p>Forza: {character.forza}</p>
      <p>Destrezza: {character.destrezza}</p>
      <p>Costituzione: {character.costituzione}</p>
      <p>Punti Vita: {character.punti_vita}</p>
    </div>
  );
}

export default CharacterDetails;