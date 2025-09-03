const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 📂 Fichier pour stocker les clients
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

  res.send(`<h2>✅ Client ${nom} enregistré</h2>
    <p><a href="/clients/liste">Voir la liste</a> | <a href="/">🏠 Accueil</a></p>`);
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
      <b><a href="/clients/${c.id}">${c.nom}</a></b> (${c.email}, ${c.telephone})
      - <a href="/clients/${c.id}/modifier">✏️ Modifier</a>
      - <a href="/clients/${c.id}/supprimer" onclick="return confirm('Supprimer ${c.nom} ?')">🗑️ Supprimer</a>
    </li>`;
  });
  html += "</ul><p><a href='/'>🏠 Accueil</a></p>";

  res.send(html);
});

// 🔎 Détails d’un client
app.get("/clients/:id", (req, res) => {
  const clients = lireClients();
  const client = clients.find(c => c.id === parseInt(req.params.id));

  if (!client) {
    return res.send("<h2>❌ Client introuvable</h2><p><a href='/clients/liste'>⬅ Retour</a></p>");
  }

  let html = `<h1>📂 Dossier de ${client.nom}</h1>
    <p><b>Email :</b> ${client.email}</p>
    <p><b>Téléphone :</b> ${client.telephone}</p>
    <p><a href="/clients/${client.id}/modifier">✏️ Modifier</a> | 
       <a href="/clients/${client.id}/supprimer" onclick="return confirm('Supprimer ${client.nom} ?')">🗑️ Supprimer</a></p>
    <h2>🧾 Factures</h2>`;

  if (client.factures.length === 0) {
    html += "<p>Aucune facture</p>";
  } else {
    client.factures.forEach(f => {
      html += `<div style="border:1px solid #ccc; padding:10px; margin:5px;">
        <p><b>Facture #${f.numero}</b> - ${f.montant} € (${f.date})</p>
        <a href="/factures/${client.id}/${f.numero}">📄 Voir la facture</a>
      </div>`;
    });
  }

  html += "<h2>🔧 Réparations</h2>";
  if (client.reparations.length === 0) {
    html += "<p>Aucune réparation</p>";
  } else {
    client.reparations.forEach(r => {
      html += `<p>${r.appareil} - ${r.probleme} (${r.statut}) [${r.date}]</p>`;
    });
  }

  html += `<p><a href="/clients/liste">⬅ Retour</a></p>`;
  res.send(html);
});

// ================= MODIFIER CLIENT =================
app.get("/clients/:id/modifier", (req, res) => {
  const clients = lireClients();
  const client = clients.find(c => c.id === parseInt(req.params.id));

  if (!client) return res.send("<h2>❌ Client introuvable</h2>");

  res.send(`
    <h1>✏️ Modifier ${client.nom}</h1>
    <form action="/clients/${client.id}/modifier" method="post">
      <label>Nom :</label><br>
      <input type="text" name="nom" value="${client.nom}" required><br><br>
      <label>Email :</label><br>
      <input type="email" name="email" value="${client.email}" required><br><br>
      <label>Téléphone :</label><br>
      <input type="text" name="telephone" value="${client.telephone}" required><br><br>
      <button type="submit">💾 Sauvegarder</button>
    </form>
    <p><a href="/clients/${client.id}">⬅ Retour au dossier</a></p>
  `);
});

app.post("/clients/:id/modifier", (req, res) => {
  let clients = lireClients();
  const client = clients.find(c => c.id === parseInt(req.params.id));

  if (!client) return res.send("<h2>❌ Client introuvable</h2>");

  client.nom = req.body.nom;
  client.email = req.body.email;
  client.telephone = req.body.telephone;

  enregistrerClients(clients);

  res.send(`<h2>✅ Client modifié avec succès</h2>
            <p><a href="/clients/${client.id}">⬅ Retour au dossier</a></p>`);
});

// ================= SUPPRIMER CLIENT =================
app.get("/clients/:id/supprimer", (req, res) => {
  let clients = lireClients();
  clients = clients.filter(c => c.id !== parseInt(req.params.id));

  clients.forEach((c, i) => c.id = i + 1);
  enregistrerClients(clients);

  res.send(`<h2>🗑️ Client supprimé</h2>
            <p><a href="/clients/liste">⬅ Retour à la liste</a></p>`);
});

// ================= FACTURES =================
app.get("/factures", (req, res) => {
  res.sendFile(path.join(__dirname, "factures.html"));
});

// Création d'une facture pro
app.post("/factures", (req, res) => {
  const { client, numero, montant } = req.body;
  let clients = lireClients();

  const clientTrouve = clients.find(c => c.nom.toLowerCase() === client.toLowerCase());
  if (!clientTrouve) {
    return res.send(`<h2>❌ Client "${client}" introuvable</h2><a href="/clients">Ajouter un client</a>`);
  }

  const nouvelleFacture = {
    id: clientTrouve.factures.length + 1,
    numero,
    montant,
    date: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date())
  };

  clientTrouve.factures.push(nouvelleFacture);
  enregistrerClients(clients);

  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Facture #${numero}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { text-align: center; }
        .facture { border: 1px solid #333; padding: 20px; max-width: 800px; margin: auto; }
        .header, .footer { display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #aaa; padding: 10px; text-align: left; }
        th { background: #f0f0f0; }
        .total { text-align: right; font-size: 1.2em; font-weight: bold; }
        .actions { margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="facture">
        <div class="header">
          <div>
            <h2>Atelier Réparation</h2>
            <p>123 Rue Exemple<br>
            38460 Trept<br>
            contact@atelier-reparation.fr</p>
          </div>
          <div>
            <img src="logo.png" alt="Logo" width="100">
          </div>
        </div>

        <h2>Facture #${numero}</h2>
        <p><b>Date :</b> ${nouvelleFacture.date}</p>

        <h3>Client :</h3>
        <p>${clientTrouve.nom}<br>
        Email : ${clientTrouve.email}<br>
        Téléphone : ${clientTrouve.telephone}</p>

        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Quantité</th>
              <th>Prix unitaire (€)</th>
              <th>Total (€)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Réparation effectuée</td>
              <td>1</td>
              <td>${montant}</td>
              <td>${montant}</td>
            </tr>
          </tbody>
        </table>

        <p class="total">Total : ${montant} €</p>

        <div class="footer">
          <p>Conditions de paiement : à réception</p>
          <p>Merci de votre confiance 🙏</p>
        </div>

        <div class="actions">
          <button onclick="window.print()">🖨️ Imprimer</button>
          <a href="/">🏠 Retour accueil</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Voir facture enregistrée
app.get("/factures/:clientId/:numero", (req, res) => {
  const clients = lireClients();
  const client = clients.find(c => c.id === parseInt(req.params.clientId));
  if (!client) return res.send("<h2>❌ Client introuvable</h2>");

  const facture = client.factures.find(f => f.numero === req.params.numero);
  if (!facture) return res.send("<h2>❌ Facture introuvable</h2>");

  res.send(`<h1>Facture #${facture.numero}</h1><p>Montant : ${facture.montant} €</p><p>Date : ${facture.date}</p>`);
});

// ================= RÉPARATIONS =================
app.get("/reparations", (req, res) => {
  res.sendFile(path.join(__dirname, "reparations.html"));
});

app.post("/reparations", (req, res) => {
  const { client, appareil, probleme, statut, date } = req.body;
  let clients = lireClients();

  const clientTrouve = clients.find(c => c.nom.toLowerCase() === client.toLowerCase());
  if (!clientTrouve) {
    return res.send(`<h2>❌ Client "${client}" introuvable</h2><a href="/clients">Ajouter un client</a>`);
  }

  const nouvelleReparation = {
    id: clientTrouve.reparations.length + 1,
    appareil,
    probleme,
    statut,
    date: date && date.trim() !== "" 
          ? date 
          : new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date())
  };

  clientTrouve.reparations.push(nouvelleReparation);
  enregistrerClients(clients);

  res.send(`<h1>✅ Réparation enregistrée</h1>
    <p><b>Client :</b> ${clientTrouve.nom}</p>
    <p><b>Appareil :</b> ${appareil}</p>
    <p><b>Problème :</b> ${probleme}</p>
    <p><b>Statut :</b> ${statut}</p>
    <p><b>Date :</b> ${nouvelleReparation.date}</p>
    <p><a href="/reparations">⬅ Retour</a></p>`);
});

// ================== LANCEMENT ==================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});


 
