import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Tentativo di login con:", username, password);
  
    try {
      const response = await fetch("http://217.154.16.188:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
  
      console.log("Risposta ricevuta:", response);
      const data = await response.json();


       if (response.ok) {
        localStorage.removeItem("token"); // 🔹 Rimuove il vecchio token
        localStorage.setItem("token", data.token); // 🔹 Salva il nuovo token
        console.log("Token salvato:", data.token);
       navigate("/characters");
        } 
      else {
        alert("Login fallito: " + data.message);
        }
  
      
      console.log("Dati ricevuti dal server:", data);
  
      if (data.token) {
        localStorage.setItem("token", data.token);
        console.log("Token salvato:", data.token);
        navigate("/characters");
      } else {
        console.error("Token non ricevuto!");
        alert("Errore: nessun token ricevuto.");
      }
    } catch (error) {
      console.error("Errore durante la fetch:", error);
      alert("Errore di connessione al server.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Accedi</button>
      </form>
    </div>
  );
}

export default Login;