const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server See-adn-chat attivo!");
});

app.listen(8080, '0.0.0.0', () => {
    console.log("Server avviato su http://localhost:3001");
});