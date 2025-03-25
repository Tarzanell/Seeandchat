import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Characters from "./pages/Characters";
import CharacterDetails from "./pages/CharacterDetails";
import NewCharacter from "./pages/NewCharacter";
import GameMapWrapper from "./pages/GameMapWrapper";
import CaricaMappa from "./pages/CaricaMappa";
import VisualizzaMappe from "./pages/VisualizzaMappe";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/new-character" element={<NewCharacter />} />
        <Route path="/character/:id" element={<CharacterDetails />} />
        <Route path="/mappa" element={<GameMapWrapper />} />
        <Route path="/carica-mappa" element={<CaricaMappa />} />
        <Route path="/visualizza-mappe" element={<VisualizzaMappe />} />
      </Routes>
    </Router>
  );
}

export default App;