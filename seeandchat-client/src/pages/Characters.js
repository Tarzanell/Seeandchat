import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Characters() {
  const [characters, setCharacters] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let isDm = false;
  let userId = 0;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      isDm = decoded.is_dm;
      userId = decoded.username;
    } catch (error) {
      console.error("Errore nella decodifica del token:", error);
    }
  }

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
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

  const handleDelete = async (id) => {
    const response = await fetch(`http://217.154.16.188:3001/api/personaggi/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      alert("Personaggio eliminato!");
      setCharacters(characters.filter((char) => char.id !== id));
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
              {char.token_img && (
                <img
                  src={`http://217.154.16.188:3001/uploads/tokens/${char.token_img}`}
                  alt={char.nome}
                  width="50"
                  height="50"
                  style={{ borderRadius: "5px" }}
                />
              )}

              <span
                onClick={() => navigate(`/character/${char.id}`)}
                style={{ cursor: "pointer", flex: 1 }}
              >
                {char.nome}
              </span>

              <button onClick={() => handleDelete(char.id)}>❌ Cancella</button>
              <button onClick={() => navigate("/mappa", {
              state: {
              character: char,
              userId,     // già estratto da jwt
              isDm,}
              })}>
              Utilizza
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nessun personaggio trovato.</p>
      )}

      <button onClick={() => navigate("/new-character")}>➕ Nuovo Personaggio</button>
      <button onClick={() => navigate("/new-new-character")}>➕ Nuovo Personaggio PROVA</button>

      {isDm && (
        <>
          <button onClick={() => navigate("/carica-mappa")}>Carica Mappa</button>
          <button onClick={() => navigate("/visualizza-mappe")}>Visualizza Mappe</button>
        </>
      )}
    </div>
  );
}

export default Characters;