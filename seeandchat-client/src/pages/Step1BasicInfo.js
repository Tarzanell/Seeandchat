function Step1BasicInfo({ formData, setFormData, onNext }) {
    const razzeDisponibili = ["Umano", "Nano", "Elfo", "Mezzelfo", "Halfling"];
    const classiDisponibili = ["Guerriero", "Ladro", "Mago", "Chierico", "Bardo"];
  
    const savingThrowMap = {
      Guerriero: ["tsFOR", "tsCOS"],
      Ladro: ["tsDES", "tsINT"],
      Mago: ["tsINT", "tsSAG"],
      Chierico: ["tsSAG", "tsCHA"],
      Bardo: ["tsDES", "tsCHA"],
    };
    
    const handleClasseChange = (classeScelta) => {
      const nuoviTs = {
        tsFOR: false,
        tsDES: false,
        tsCOS: false,
        tsINT: false,
        tsSAG: false,
        tsCHA: false,
      };
    

      const prof = savingThrowMap[classeScelta] || [];
      prof.forEach(ts => {
        nuoviTs[ts] = true;
      });

      const dadoVita = pfPerClasse[classeScelta] || 8;
      const pfIniziali = dadoVita;

      setFormData({
        ...formData,
        classe: classeScelta,
        ...nuoviTs,
        pfmax: pfIniziali,
        pfatt: pfIniziali,
        dv: 1,
        dvmax: 1,
        dvatt: 1,
      });
    
    };

     // Imposta pf iniziali e dado vita per classe
      const pfPerClasse = {
        Guerriero: 10,
        Ladro: 8,
        Mago: 6,
        Chierico: 8,
        Bardo: 8,
      };


    return (
      <div>
        <label>Nome:</label>
        <input
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        />
  
        <label>Età:</label>
        <input
          value={formData.eta}
          onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
        />
  
        <label>Altezza:</label>
        <input
          value={formData.altezza}
          onChange={(e) => setFormData({ ...formData, altezza: e.target.value })}
        />
  
        <label>Peso:</label>
        <input
          value={formData.peso}
          onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
        />
  
        <label>Razza:</label>
        <select
          value={formData.razza}
          onChange={(e) => setFormData({ ...formData, razza: e.target.value })}
        >
          <option value="">-- Scegli razza --</option>
          {razzeDisponibili.map((razza) => (
            <option key={razza} value={razza}>{razza}</option>
          ))}
        </select>
  
        <label>Classe:</label>
        <select
          value={formData.classe}
          onChange={(e) => handleClasseChange(e.target.value)}
>
          <option value="">-- Scegli classe --</option>
          {classiDisponibili.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
  
        <button onClick={onNext} disabled={!formData.nome || !formData.razza || !formData.classe}>
          Avanti
        </button>
      </div>
    );
  }
  
  export default Step1BasicInfo;