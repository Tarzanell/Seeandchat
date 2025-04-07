import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Characters() {
  const [characters, setCharacters] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let isDm = false;
  let userId = 0;
  let utentenome ="";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      isDm = decoded.is_dm;
      userId = decoded.id;
      utentenome = decoded.username;
    } catch (error) {
      console.error("Errore nella decodifica del token:", error);
    }
  }

  useEffect(() => {
    fetchCharacters();
  }, []);

  /*const fetchCharacters = async () => {
    const response = await fetch("http://217.154.16.188:3001/api/listapersonaggi", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (response.ok) {
      setCharacters(data);
    } else {
      alert("Errore nel recupero dei personaggi.");
    }
  };*/

  const fetchCharacters = async () => {

    const endpoint = isDm
    ? "http://217.154.16.188:3001/api/listapersonaggidm"
    : "http://217.154.16.188:3001/api/listapersonaggi";

    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

    const data = await response.json();
    if (response.ok) {
      setCharacters(data);
    } else {
      alert("Errore nel recupero dei personaggi.");
    }
  } catch (error) {
    console.error("Errore nella fetch dei personaggi:", error);
    alert("Errore di rete.");
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

const handleUtilizza = async (char) =>{

  const response = await fetch(`http://217.154.16.188:3001/api/utenti/${userId}/${char.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    alert("LastPg aggiornato!");
  } else {
    alert("Errore nel coso dell'ultimo personaggio.");
  }


  navigate("/mappa", {
    state: {
    character: char,
    userId,     // già estratto da jwt
    isDm,}
    });


};


  return (

    
        
    <div>

        {!isDm && <button onClick={() => navigate("/characters")}>Torna ai Personaggi</button>}
        {isDm && <button onClick={() => navigate("/dmdashboard")}>Vai al DM Dashboard</button>}
      

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
                {" | Proprietario: "}
                {char.utente_nome}
              </span>
                
              <button onClick={() => handleDelete(char.id)}>❌ Cancella</button>
              <button onClick={() => handleUtilizza(char)}>Utilizza</button>
              
            </li>
          ))}
        </ul>
      ) : (
        <p>Nessun personaggio trovato.</p>
      )}

      <button onClick={() => navigate("/new-new-character", {
              state: {utentenome,}
              })}>➕ Nuovo Personaggio</button>

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