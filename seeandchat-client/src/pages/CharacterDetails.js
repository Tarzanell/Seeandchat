import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function CharacterDetails() {
  const { id } = useParams(); // 🔹 Ottiene l'ID dalla URL
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true); // 🔹 Stato per il caricamento
  const [error, setError] = useState(null); // 🔹 Stato per gestire errori

  useEffect(() => {
   
    const fetchCharacter = async () => {
      setLoading(true); // 🔹 Mostra "Caricamento..."
      setError(null); // 🔹 Reset degli errori precedenti
      const token = localStorage.getItem("token");

      try {
        console.log("PAssaggio ad API server");
        console.log("🔹 Richiesta a:", `http://217.154.16.188:3001/api/personaggi/${id}`);
        const response = await fetch(`http://217.154.16.188:3001/api/personaggi/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        

        if (!response.ok) {
          console.log("Errore token dettaglichar");
          throw new Error(`Errore HTTP! Status: ${response.status}`);
        }

        const data = await response.json();
        setCharacter(data); // 🔹 Imposta il personaggio ricevuto
      } catch (err) {
        setError(err.message); // 🔹 Salva l'errore
      } finally {
        setLoading(false); // 🔹 Disabilita il caricamento
      }
    };

    
    fetchCharacter();
  }, [id]);

  // 🔹 Se il personaggio non è stato caricato
  if (loading) return <p>Caricamento...</p>;
  if (error) return <p>Errore: {error}</p>;
  if (!character) return <p>Personaggio non trovato.</p>;

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