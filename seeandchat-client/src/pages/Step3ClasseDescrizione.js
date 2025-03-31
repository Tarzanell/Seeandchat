import React, { useState, useEffect } from "react";

const classiDisponibili = {
  barbaro: ["atletica", "intimidire", "natura", "percezione", "sopravvivenza"],
  bardo: [
    "acrobazia", "furtività", "intuizione", "intrattenere", "intimidire",
    "indagare", "rapidita_di_mano", "percezione", "persuasione", "ingannare"
  ],
  chierico: ["intuizione", "medicina", "persuasione", "religione"],
  druido: ["arcano", "intuizione", "medicina", "natura", "percezione", "sopravvivenza"],
  guerriero: ["acrobazia", "atletica", "intimidire", "percezione", "sopravvivenza", "storia"],
  ladro: [
    "acrobazia", "furtività", "indagare", "intuizione",
    "rapidita_di_mano", "ingannare", "percezione", "persuasione"
  ],
  mago: ["arcano", "indagare", "intuizione", "medicina", "religione", "storia"],
  paladino: ["atletica", "intuizione", "intimidire", "medicina", "persuasione", "religione"],
  ranger: ["atletica", "intuizione", "indagare", "natura", "percezione", "furtività", "sopravvivenza"],
  stregone: ["arcano", "ingannare", "intimidire", "persuasione", "religione"],
  warlock: ["arcano", "ingannare", "intimidire", "indagare", "religione"],
};

function Step3ClasseDescrizione({ formData, setFormData, onNext, onBack }) {
  const [abilitaSelezionate, setAbilitaSelezionate] = useState(formData.abilita || []);
  const [descrizione, setDescrizione] = useState(formData.descrizione || "");

  const classe = formData.classe?.toLowerCase(); // difensivo
  const abilitaDisponibili = classe ? classiDisponibili[classe] || [] : [];

  useEffect(() => {
    // Se cambi classe nel futuro, resetti abilità
    if (!abilitaDisponibili.includes(abilitaSelezionate[0])) {
      setAbilitaSelezionate([]);
    }
  }, [classe]);

  const toggleAbilita = (abilita) => {
    if (abilitaSelezionate.includes(abilita)) {
      setAbilitaSelezionate(abilitaSelezionate.filter((a) => a !== abilita));
    } else if (abilitaSelezionate.length < 2) {
      setAbilitaSelezionate([...abilitaSelezionate, abilita]);
    }
  };

  const handleNext = () => {
    if (abilitaSelezionate.length !== 2) {
      alert("Seleziona esattamente due abilità.");
      return;
    }
    setFormData({
      ...formData,
      abilita: abilitaSelezionate,
      descrizione: descrizione,
    });
    onNext();
  };

  return (
    <div>
      <h2>Step 3: Abilità e Descrizione</h2>

      <h3>Classe selezionata: {formData.classe}</h3>

      {abilitaDisponibili.length > 0 && (
        <>
          <p>Seleziona due abilità:</p>
          {abilitaDisponibili.map((abilita) => (
            <label key={abilita} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={abilitaSelezionate.includes(abilita)}
                onChange={() => toggleAbilita(abilita)}
                disabled={
                  !abilitaSelezionate.includes(abilita) &&
                  abilitaSelezionate.length >= 2
                }
              />
              {abilita}
            </label>
          ))}
        </>
      )}

      <h3>Descrizione del personaggio</h3>
      <textarea
        rows={4}
        cols={50}
        value={descrizione}
        onChange={(e) => setDescrizione(e.target.value)}
        placeholder="Scrivi qualcosa sul tuo personaggio..."
      />

      <br />
      <button onClick={onBack}>Indietro</button>
      <button onClick={handleNext}>Avanti</button>
    </div>
  );
}

export default Step3ClasseDescrizione;