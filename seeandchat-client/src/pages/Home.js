import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Benvenuto su Dorigo gay</h1>
      <p>Effettua il login o crea un nuovo account.</p>
      <button onClick={() => navigate("/login")}>Login</button>
      <button onClick={() => navigate("/register")}>Nuovo Utente</button>
    </div>
  );
}

export default Home;