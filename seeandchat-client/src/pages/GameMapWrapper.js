import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GameMap from "./GameMap";

function GameMapWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state?.character) {
    navigate("/characters");
    return null;
  }

  return <GameMap character={location.state.character} />;
}

export default GameMapWrapper;