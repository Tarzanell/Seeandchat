import { useEffect } from "react";

function PingOnline() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const ping = () => {
      fetch("http://217.154.16.188:3001/api/ping", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    };

    ping(); // invia subito
    const intervallo = setInterval(ping, 10000); // ogni 10s

    return () => clearInterval(intervallo);
  }, []);

  return null; // non rende nulla visivamente
}

export default PingOnline;