import { useState } from "react";
import { useLocation } from "react-router-dom";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2PointBuy from "./Step2PointBuy";
import Step3ClasseDescrizione from "./Step3ClasseDescrizione";
import Step4UploadEFinale from "./Step4UploadEFinale";

function CharacterCreationWizard() {
  const location = useLocation();
  const [step, setStep] = useState(1);
  const nomeutente = location.state?.utentenome;
console.log("Nome utente:", nomeutente);
  const [formData, setFormData] = useState({
    utente_nome:nomeutente,
    nome: "",
    eta: "",
    altezza: "",
    peso: "",
    razza: "",
    classe: "",
    stats: {
      FOR: 8,
      DES: 8,
      COS: 8,
      INT: 8,
      SAG: 8,
      CHA: 8,
    },
    razzaBonus: {},  // gestito in point buy
    sceltaMezzelfo: "", // solo se razza è mezzelfo
  });

  const goNext = () => setStep(prev => prev + 1);
  const goBack = () => setStep(prev => prev - 1);

  return (
    <div>
      <h2>Creazione Personaggio</h2>

      {step === 1 && (
        <Step1BasicInfo
          formData={formData}
          setFormData={setFormData}
          onNext={goNext}
        />
      )}

      {step === 2 && (
        <Step2PointBuy
          formData={formData}
          setFormData={setFormData}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {step === 3 && (
        <Step3ClasseDescrizione
          formData={formData}
          setFormData={setFormData}
          onNext={goNext}
          onBack={goBack}
        />
      )}

        {step === 4 && (
         <Step4UploadEFinale
          formData={formData}
           onBack={goBack}
         />
        )}
    </div>
  );
}

export default CharacterCreationWizard;