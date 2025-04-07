import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Characters from "./pages/Characters";
import CharacterDetails from "./pages/CharacterDetails";
import GameMapWrapper from "./pages/GameMapWrapper";
import CaricaMappa from "./pages/CaricaMappa";
import VisualizzaMappe from "./pages/VisualizzaMappe";
import VisualizzaTransizioni from "./pages/VisualizzaTransizioni";
import DMDashboard from "./pages/DMDashboard";
import NuovoSpawn from "./pages/NuovoSpawn";
import NuovaTransizione from "./pages/NuovaTransizione";
import NuovoArchetipoOggetto from "./pages/NuovoArchetipoOggetto";
import NuovoArchetipoMob from "./pages/NuovoArchetipoMob";
import NuovoNPC from "./pages/NuovoNPC"
import VisualizzaArchetipi from "./pages/VisualizzaArchetipi";
import VisualizzaTokens from "./pages/VisualizzaTokens";
import NewNewCharacter from "./pages/CharacterCreationWizard";
import PingOnline from "./components/PingOnline";
import CharacterEditForms from "./components/CharacterEditForms";

function App() {
  return (
    <Router>
      {localStorage.getItem("token") && <PingOnline />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />       
        <Route path="/register" element={<Register />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/new-new-character" element={<NewNewCharacter />} />
        <Route path="/character/:id" element={<CharacterDetails />} />
        <Route path="/mappa" element={<GameMapWrapper />} />
        <Route path="/carica-mappa" element={<CaricaMappa />} />
        <Route path="/visualizza-mappe" element={<VisualizzaMappe />} />
        <Route path="/dmdashboard" element={<DMDashboard />} />
        <Route path="/nuovo-spawn" element={<NuovoSpawn />} />
        <Route path="/nuova-transizione" element={<NuovaTransizione />} />
        <Route path="/nuovo-archetipo-oggetto" element={<NuovoArchetipoOggetto />} />
        <Route path="/nuovo-archetipo-mob" element={<NuovoArchetipoMob />} />
        <Route path="/nuovo-npc" element={<NuovoNPC />} />
        <Route path="/visualizza-archetipi" element={<VisualizzaArchetipi />} />
        <Route path="/visualizza-tokens" element={<VisualizzaTokens />} />
        <Route path="/visualizza-transizioni" element={<VisualizzaTransizioni />} />
       </Routes>
    </Router>
  );
}

export default App;