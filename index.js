const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Page d'accueil
app.get("/", (req, res) => {
  res.send("<h1>Bienvenue sur Atelier Réparation</h1><p>Logiciel de gestion en ligne</p>");
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
