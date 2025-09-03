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
      <li><a href="/factures">🧾 Créer une facture</a></li>
      <li><a href="/reparations">🔧 Ajouter une réparation</a></li>
    </ul>
  `);
});

// ================= CLIENTS =================
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

// Liste des clients
app.get("/clients/liste", (req, res) => {
  const clients = lireClients();

  if (clients.length === 0) {
    return res.send("<h2>📂 Aucun client enregistré.</h2><p><a href='/'>🏠 Accueil</a></p>");
  }

  let html = "<h1>📂 Liste des clients</h1><ul>";
  clients.forEach(c => {
    html += `<li>
      <b>${c.nom}</b> (${c.email}, ${c.telephone}) - ${c.ville}, ${c.pays}
      <ul>
        <li>Factures : ${c.factures.length}</li>
        <li>Réparations : ${c.reparations.length}</li>
      </ul>
    </li>`;
  });
  html += "</ul><p><a href='/'>🏠 Accueil</a></p>";

  res.send(html);
});

// ================= FACTURES =================
app.get("/factures", (req, res) => {
  res.sendFile(path.join(__dirname, "factures.html"));
});

app.post("/factures", (req, res) => {
  const { client, numero, montant } = req.body;
  let clients = lireClients();

  const clientTrouve = clients.find(c => c.nom.toLowerCase() === client.toLowerCase());
  if (!clientTrouve) {
    return res.send(`<h2>❌ Client "${client}" introuvable</h2>
                     <a href="/clients">Ajouter un client</a>`);
  }

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

  const clientTrouve = clients.find(c => c.nom.toLowerCase() === client.toLowerCase());
  if (!clientTrouve) {
    return res.send(`<h2>❌ Client "${client}" introuvable</h2>
                     <a href="/clients">Ajouter un client</a>`);
  }

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
