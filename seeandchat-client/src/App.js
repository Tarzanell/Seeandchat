import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Characters from "./pages/Characters";
import CharacterDetails from "./pages/CharacterDetails";
import NewCharacter from "./pages/NewCharacter";

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
      </Routes>
    </Router>
  );
}

export default App;