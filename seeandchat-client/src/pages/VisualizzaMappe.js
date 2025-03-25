// src/pages/VisualizzaMappe.js
import { useEffect, useState } from "react";

function VisualizzaMappe() {
  const [mappe, setMappe] = useState([]);

  useEffect(() => {
    const fetchMappe = async () => {
      const response = await fetch("http://217.154.16.188:3001/api/tutte-le-mappe");
      const data = await response.json();
      if (response.ok) {
        setMappe(data);
      } else {
        alert("Errore nel recupero mappe");
      }
    };

    fetchMappe();
  }, []);

  return (
    <div>
      <h2>Mappe disponibili</h2>
      {mappe.map((mappa) => (
        <div key={mappa.id} style={{ marginBottom: "20px" }}>
          <p><strong>ID:</strong> {mappa.id} - <strong>Nome:</strong> {mappa.nome}</p>
          <img
            src={`http://217.154.16.188:3001/uploads/mappe/${mappa.immagine}`}
            alt={mappa.nome}
            style={{ width: "300px", border: "1px solid gray" }}
          />
        </div>
      ))}
    </div>
  );
}

export default VisualizzaMappe;