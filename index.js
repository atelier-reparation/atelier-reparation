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
      <li><a href="/clients">👥 Clients</a></li>
      <li><a href="/factures">🧾 Factures</a></li>
      <li><a href="/reparations">🔧 Réparations</a></li>
    </ul>
  `);
});

// ================= CLIENTS =================
app.get("/clients", (req, res) => {
  res.sendFile(path.join(__dirname, "clients.html"));
});

app.post("/clients", (req, res) => {
  const { nom, email, telephone, adresse } = req.body;
  let clients = lireClients();

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
    <p><a href="/clients">⬅ Retour</a> | <a href="/">🏠 Accueil</a></p>
  `);
});

// ================= FACTURES =================
app.get("/factures", (req, res) => {
  res.sendFile(path.join(__dirname, "factures.html"));
});

app.post("/factures", (req, res) => {
  const { client, numero, montant } = req.body;
  let clients = lireClients();

  // Vérifie si le client existe
  const clientTrouve = clients.find(c => c.nom.toLowerCase() === client.toLowerCase());

  if (!clientTrouve) {
    return res.send(`
      <h2>❌ Client "${client}" introuvable</h2>
      <p>Ajoute d'abord le client avant de créer une facture.</p>
      <a href="/clients">Ajouter un client</a>
    `);
  }

  // Crée la facture
  const nouvelleFacture = {
    id: clientTrouve.factures.length + 1,
    numero,
    montant,
    date: new Date().toLocaleDateString()
  };

  clientTrouve.factures.push(nouvelleFacture);
  enregistrerClients(clients);

  res.send(`
    <h1>✅ Facture enregistrée</h1>
    <p><b>Client :</b> ${clientTrouve.nom}</p>
    <p><b>Numéro :</b> ${numero}</p>
    <p><b>Montant :</b> ${montant} €</p>
    <p><b>Date :</b> ${nouvelleFacture.date}</p>

    <button onclick="window.print()">🖨️ Imprimer</button>

    <p><a href="/factures">⬅ Retour</a> | <a href="/">🏠 Accueil</a></p>
  `);
});

// ================= RÉPARATIONS =================
app.get("/reparations", (req, res) => {
  res.sendFile(path.join(__dirname, "reparations.html"));
});

app.post("/reparations", (req, res) => {
  const { client, appareil, probleme, statut } = req.body;
  let clients = lireClients();

  // Vérifie si le client existe
  const clientTrouve = clients.find(c => c.nom.toLowerCase() === client.toLowerCase());

  if (!clientTrouve) {
    return res.send(`
      <h2>❌ Client "${client}" introuvable</h2>
      <p>Ajoute d'abord le client avant de créer une réparation.</p>
      <a href="/clients">Ajouter un client</a>
    `);
  }

  // Crée la réparation
  const nouvelleReparation = {
    id: clientTrouve.reparations.length + 1,
    appareil,
    probleme,
    statut,
    date: new Date().toLocaleDateString()
  };

  clientTrouve.reparations.push(nouvelleReparation);
  enregistrerClients(clients);

  res.send(`
    <h1>✅ Réparation enregistrée</h1>
    <p><b>Client :</b> ${clientTrouve.nom}</p>
    <p><b>Appareil :</b> ${appareil}</p>
    <p><b>Problème :</b> ${probleme}</p>
    <p><b>Statut :</b> ${statut}</p>
    <p><b>Date :</b> ${nouvelleReparation.date}</p>

    <p><a href="/reparations">⬅ Retour</a> | <a href="/">🏠 Accueil</a></p>
  `);
});

// ================== LANCEMENT ==================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
