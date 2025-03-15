const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server See-adn-chat attivo!");
});

app.listen(3001, () => {
    console.log("Server avviato su http://localhost:3001");
});