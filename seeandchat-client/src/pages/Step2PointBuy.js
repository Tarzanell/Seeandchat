import React, { useState, useEffect } from "react";

const costs = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

const Step2PointBuy = ({ formData, setFormData, onNext, onBack }) => {
  const [scores, setScores] = useState(formData.stats || {
    FOR: 8,
    DES: 8,
    COS: 8,
    INT: 8,
    SAG: 8,
    CHA: 8,
  });
  
  const [bonusAScelta, setBonusAScelta] = useState(formData.bonusAScelta || "");
  const [pointsLeft, setPointsLeft] = useState(27);

  useEffect(() => {
    let spent = Object.values(scores).reduce((sum, score) => sum + costs[score], 0);
    setPointsLeft(27 - spent);
  }, [scores]);

  const handleIncrement = (stat) => {
    const newValue = scores[stat] + 1;
    if (newValue > 15) return;
    const newCost = costs[newValue];
    const currentCost = costs[scores[stat]];
    if ((newCost - currentCost) > pointsLeft) return;
    setScores({ ...scores, [stat]: newValue });
  };

  const handleDecrement = (stat) => {
    const newValue = scores[stat] - 1;
    if (newValue < 8) return;
    setScores({ ...scores, [stat]: newValue });
  };

  const getBonus = (stat) => {
    const race = formData.razza;
    if (race === "Umano") return 1;
    if (race === "Nano" && stat === "COS") return 2;
    if (race === "Elfo" && stat === "DES") return 2;
    if (race === "Mezzelfo") {
      if (stat === "CHA") return 2;
      if (stat === bonusAScelta) return 1;
    }
    return 0;
  };

  const handleNext = () => {
    const statsConBonus = {};
    Object.keys(scores).forEach((stat) => {
    statsConBonus[stat] = scores[stat] + getBonus(stat);
    });

    setFormData({ ...formData, stats: statsConBonus, bonusAScelta });
    onNext();
  };

  return (
    <div>
      <h2>Step 2: Point Buy</h2>
      <p>Punti rimanenti: {pointsLeft}</p>

      {Object.keys(scores).map((stat) => {
        const bonus = getBonus(stat);
        const total = scores[stat] + bonus;

        return (
          <div key={stat}>
            <strong>{stat}</strong>: 
            <button onClick={() => handleDecrement(stat)}>-</button>
            {scores[stat]} base
            <button onClick={() => handleIncrement(stat)}>+</button>
            {bonus > 0 && <span> +{bonus} bonus</span>} = {total}
          </div>
        );
      })}

      {formData.razza === "Mezzelfo" && (
        <div>
          <p>Scegli una caratteristica diversa da CHA per assegnare un bonus +1:</p>
          <select value={bonusAScelta} onChange={(e) => setBonusAScelta(e.target.value)}>
            <option value="">-- Seleziona --</option>
            {["FOR", "DES", "COS", "INT", "SAG"].map((stat) => (
              <option key={stat} value={stat}>{stat}</option>
            ))}
          </select>
        </div>
      )}

      <br />
      <button onClick={onBack}>Indietro</button>
      <button onClick={handleNext} disabled={pointsLeft < 0 || (formData.razza === "Mezzelfo" && !bonusAScelta)}>Prosegui</button>
    </div>
  );
};

export default Step2PointBuy;