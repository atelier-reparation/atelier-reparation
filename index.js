const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");

app.use(express.urlencoded({ extended: true }));

// Page d'accueil
app.get("/", (req, res) => {
  res.send("<h1>Bienvenue sur Atelier Réparation</h1><p>Logiciel de gestion en ligne</p>");
});

// Page Clients
app.get("/clients", (req, res) => {
  res.sendFile(path.join(__dirname, "clients.html"));
});

app.post("/clients", (req, res) => {
  const { nom, email, telephone, adresse } = req.body;
  console.log("📌 Nouveau client :", nom, email, telephone, adresse);
  res.send(`<h2>Client ${nom} enregistré avec succès ✅</h2>
            <a href="/clients">Retour</a>`);
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
