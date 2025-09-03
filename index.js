const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 📂 Fichier pour stocker les clients et leurs données
const clientsFile = path.join(__dirname, "clients.json");

// Fonctions utilitaires
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
      <li><a href="/clients">👥 Ajouter un client</a></li>
      <li><a href="/clients/liste">📂 Liste des clients</a></li>
    </ul>
  `);
});

// ================= CLIENTS (AJOUT) =================
app.get("/clients", (req, res) => {
  res.sendFile(path.join(__dirname, "clients.html"));
});

app.post("/clients", (req, res) => {
  const { nom, email, telephone, adresse, adresse2, cp, ville, pays } = req.body;
  let clients = lireClients();

  const nouveauClient = {
    id: clients.length + 1,
    nom,
    email,
    telephone,
    adresse,
    adresse2,
    cp,
    ville,
    pays,
    factures: [],
    reparations: []
  };

  clients.push(nouveauClient);
  enregistrerClients(clients);

  res.send(`
    <h2>✅ Client ${nom} enregistré</h2>
    <p><b>Email :</b> ${email}</p>
    <p><b>Téléphone :</b> ${telephone}</p>
    <p><b>Adresse :</b><br>
       ${adresse}${adresse2 ? "<br>" + adresse2 : ""}<br>
       ${cp} ${ville}<br>
       ${pays}
    </p>
    <p><a href="/clients">⬅ Retour</a> | <a href="/">🏠 Accueil</a></p>
  `);
});

// ================= CLIENTS (LISTE) =================
app.get("/clients/liste", (req, res) => {
  const clients = lireClients();

  if (clients.length === 0) {
    return res.send("<h2>📂 Aucun client enregistré.</h2><p><a href='/'>🏠 Accueil</a></p>");
  }

  let html = "<h1>📂 Liste des clients</h1><ul>";
  clients.forEach(c => {
    html += `<li>
      <b>${c.nom}</b> (${c.email}, ${c.telephone}) - ${c.ville}, ${c.pays}
    </li>`;
  });
  html += "</ul><p><a href='/'>🏠 Accueil</a></p>";

  res.send(html);
});

// ================== LANCEMENT ==================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
