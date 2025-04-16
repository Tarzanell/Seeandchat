import React, { useEffect, useState } from "react";

function GiocatoriOnlinePopup({mioToken, onClose}) {
  const [utenti, setUtenti] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [popupVisibile, setPopupVisibile] = useState(false);
  const [destinatario, setDestinatario] = useState(null);
  const [testoMessaggio, setTestoMessaggio] = useState("");
  const token = localStorage.getItem("token");
  const [popupMissivaVisibile, setPopupMissivaVisibile] = useState(false);
  const [titoloMissiva, setTitoloMissiva] = useState("");
  const [testoMissiva, setTestoMissiva] = useState("");
  const [locazioneMissiva, setLocazioneMissiva] = useState("");


  useEffect(() => {
    const fetchData = async () => {
      try {
        const resUtenti = await fetch("http://217.154.16.188:3001/api/allutenti", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const utentiData = await resUtenti.json();

        const resTokens = await fetch("http://217.154.16.188:3001/api/allchartokens", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tokensData = await resTokens.json();
        setUtenti(utentiData);
        setTokens(tokensData);
      } catch (err) {
        console.error("Errore nel fetch di utenti o token:", err);
      }
    };
    fetchData();
  }, []);

  const now = Date.now();
  const CINQUE_MINUTI = 5 * 60 * 1000;

  const handleInvioMessaggioPrivato = async () => {
    if (!destinatario || !testoMessaggio.trim()) return;

    const comando = `/p ${destinatario.nome} ${testoMessaggio}`;
    try {
      await fetch("http://217.154.16.188:3001/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          testo: comando,
          mappa_id: 1, // può essere qualsiasi valore, non verrà usato
          nome_personaggio: mioToken.nome, // verrà comunque rimpiazzato server-side
          voce: "parlando",
          linguaggio: "comune",
          mapNome: "Messaggio Privato"
        })
      });
      alert("Messaggio privato inviato!");
      setPopupVisibile(false);
      setTestoMessaggio("");
      setDestinatario(null);
    } catch (err) {
      console.error("Errore invio messaggio:", err);
    }
  };

  const handleInvioMissiva = async () => {
    if (!destinatario || !testoMissiva.trim() || !locazioneMissiva.trim()) return;
  
    try {
      await fetch("http://217.154.16.188:3001/api/inviomissive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mittente_id: mioToken.fatherid,
          mittente_nome: mioToken.nome,
          destinatario_nome: destinatario.nome,
          titolo: titoloMissiva,
          testo: testoMissiva,
          locazione: locazioneMissiva
        })
      });
      console.log("Mittenteid", mioToken.fatherid);
      alert("Missiva inviata!");
      setPopupMissivaVisibile(false);
      setTitoloMissiva("Titolo");
      setTestoMissiva("");
      setLocazioneMissiva("");
      setDestinatario(null);
    } catch (err) {
      console.error("Errore invio missiva:", err);
    }
  };

  const renderUtenteOnline = (utente) => {
    const isOnline = now - new Date(utente.ultimo_ping).getTime() < CINQUE_MINUTI;
    const tokenPg = tokens.find(t => t.fatherid == utente.lastPg);

    return (
      <div key={utente.id}>
        {isOnline && tokenPg && (
          
          <div style={{ border: "1px solid black", padding:5, display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
            {utente.username}
            
            <img
              src={`http://217.154.16.188:3001/uploads/tokens/${tokenPg.immagine}`}
              alt="Anteprima token"
              style={{ width: "50px", height: "50px", objectFit: "cover" }}
            />
            <span><strong>{tokenPg.nome}</strong></span>
            <button onClick={() => {
              setDestinatario({ nome: tokenPg.nome, mittente: tokenPg.nome });
              setPopupMissivaVisibile(true);
            }}>Invia missiva</button>
            
            <button onClick={() => {
              setDestinatario({ nome: tokenPg.nome, mittente: tokenPg.nome });
              setPopupVisibile(true);
            }}>Messaggio privato</button>

          </div>
        )}
      </div>
    );
  };

  const renderUtenteOffline = (tokenPg) => {
    const proprietario = utenti.find(u => Number(u.id) === Number(tokenPg.proprietario_id));
    const username = proprietario ? proprietario.username : "(Sconosciuto)";
    return (
      <div key={tokenPg.id}>
        <div style={{ border: "1px solid black", padding: 5, display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
          {username}
  
          <img
            src={`http://217.154.16.188:3001/uploads/tokens/${tokenPg.immagine}`}
            alt="Anteprima token"
            style={{ width: "50px", height: "50px", objectFit: "cover" }}
          />
          <span><strong>{tokenPg.nome}</strong></span>
          <button onClick={() => {
            setDestinatario({ nome: tokenPg.nome, mittente: mioToken.nome });
            setPopupMissivaVisibile(true);
          }}>Invia missiva</button>
  
          <button onClick={() => {
            setDestinatario({ nome: tokenPg.nome, mittente: mioToken.nome });
            setPopupVisibile(true);
          }}>Messaggio privato</button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ position: "fixed", top: "10%", left: "10%", right: "50%", bottom: "40%", background: "white", border: "2px solid black", overflowY: "auto", padding: "20px", zIndex: 9999 }}>
      <h3>Personaggi Online</h3>
      <button onClick={onClose} style={{ float: "right", marginTop: "-30px" }}>Chiudi</button>

{Array.isArray(utenti) && utenti.map(renderUtenteOnline)}

<h3>Personaggi Offline</h3>
{Array.isArray(tokens) &&
  tokens
    .filter(t => {
      const inUso = utenti.some(u => {
        const online = now - new Date(u.ultimo_ping).getTime() < CINQUE_MINUTI;
        return online && u.lastPg == t.fatherid;
      });
      return !inUso;
    })
    .map(renderUtenteOffline)}
      </div>
  
      {popupVisibile && destinatario && (
        <div style={{
          position: "fixed",
          top: "30%",
          left: "30%",
          width: "40%",
          background: "white",
          border: "2px solid black",
          padding: "20px",
          zIndex: 10000
        }}>
          <h4>Invia messaggio a <span style={{ color: "purple" }}>{destinatario.nome}</span></h4>
          <textarea
            value={testoMessaggio}
            onChange={(e) => setTestoMessaggio(e.target.value)}
            rows={5}
            style={{ width: "100%" }}
          />
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleInvioMessaggioPrivato}>Invia</button>
            <button onClick={() => setPopupVisibile(false)} style={{ marginLeft: "10px" }}>Annulla</button>
          </div>
        </div>
      )}
  
      {popupMissivaVisibile && destinatario && (
        <div style={{
          position: "fixed",
          top: "30%",
          left: "30%",
          width: "40%",
          background: "white",
          border: "2px solid black",
          padding: "20px",
          zIndex: 10000
        }}>
          <h4>Invia missiva a <span style={{ color: "purple" }}>{destinatario.nome}</span></h4>
          <textarea
            placeholder="Titolo della Missiva"
            value={titoloMissiva}
            onChange={(e) => setTitoloMissiva(e.target.value)}
            rows={4}
            style={{ width: "100%" }}
          />
          <textarea
            placeholder="Contenuto della missiva"
            value={testoMissiva}
            onChange={(e) => setTestoMissiva(e.target.value)}
            rows={4}
            style={{ width: "100%" }}
          />
          <input
            type="text"
            placeholder="Dove la lasci?"
            value={locazioneMissiva}
            onChange={(e) => setLocazioneMissiva(e.target.value)}
            style={{ width: "100%", marginTop: "10px" }}
          />
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleInvioMissiva}>Invia</button>
            <button onClick={() => setPopupMissivaVisibile(false)} style={{ marginLeft: "10px" }}>Annulla</button>
          </div>
        </div>
      )}
    </>
  );
}

export default GiocatoriOnlinePopup;