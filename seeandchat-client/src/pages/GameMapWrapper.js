import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GameMap from "./GameMap";

function GameMapWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  const character = location.state?.character;
  const userId = location.state?.userId;
  const isDm = location.state?.isDm;

  if (!character) {
    navigate("/characters");
    return null;
  }

  return <GameMap character={character} userId={userId} isDm={isDm} />;
}

export default GameMapWrapper;