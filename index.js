const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 📂 Fichier pour stocker les clients
const clientsFile = path.join(__dirname, "clients.json");

// Fonction utilitaire pour lire/écrire le fichier
function lireClients() {
  if (!fs.existsSync(clientsFile)) return [];
  return JSON.parse(fs.readFileSync(clientsFile, "utf8"));
}

function enregistrerClients(clients) {
  fs.writeFileSync(clientsFile, JSON.stringify(clients, null, 2));
}

// ================= PAGE D’ACCUEIL =================
app.get("/", (req, res) => {
  res.send(`
    <h1>Bienvenue sur Atelier Réparation 📱</h1>
    <ul>
      <li><a href="/clients">👥 Clients</a></li>
    </ul>
  `);
});

// ================= PAGE CLIENTS =================
app.get("/clients", (req, res) => {
  res.sendFile(path.join(__dirname, "clients.html"));
});

app.post("/clients", (req, res) => {
  const { nom, email, telephone, adresse } = req.body;

  let clients = lireClients();

  // Crée un "dossier client"
  const nouveauClient = {
    id: clients.length + 1,
    nom,
    email,
    telephone,
    adresse,
    factures: [],
    reparations: []
  };

  clients.push(nouveauClient);
  enregistrerClients(clients);

  res.send(`
    <h2>✅ Client ${nom} enregistré</h2>
    <p>Email : ${email}</p>
    <p>Téléphone : ${telephone}</p>
    <p>Adresse : ${adresse}</p>
    <p><a href="/clients">⬅ Retour</a></p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
