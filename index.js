const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// ================= FACTURES =================
app.get("/factures", (req, res) => {
  res.sendFile(path.join(__dirname, "factures.html"));
});

// Création facture avec plusieurs lignes
app.post("/factures", (req, res) => {
  const { client, numero, designation, quantite, prix } = req.body;
  let clients = lireClients();

  const clientTrouve = clients.find(c => c.nom.toLowerCase() === client.toLowerCase());
  if (!clientTrouve) {
    return res.send(`<h2>❌ Client "${client}" introuvable</h2><a href="/clients">Ajouter un client</a>`);
  }

  // Construire lignes
  let lignes = [];
  let totalGlobal = 0;

  for (let i = 0; i < designation.length; i++) {
    const qte = parseFloat(quantite[i]) || 0;
    const pu = parseFloat(prix[i]) || 0;
    const total = qte * pu;
    totalGlobal += total;

    lignes.push({
      designation: designation[i],
      quantite: qte,
      prix: pu,
      total: total
    });
  }

  const nouvelleFacture = {
    id: clientTrouve.factures.length + 1,
    numero,
    date: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date()),
    lignes,
    montant: totalGlobal
  };

  clientTrouve.factures.push(nouvelleFacture);
  enregistrerClients(clients);

  // Affichage facture pro
  let lignesHTML = "";
  nouvelleFacture.lignes.forEach(l => {
    lignesHTML += `
      <tr>
        <td>${l.designation}</td>
        <td>${l.quantite}</td>
        <td>${l.prix.toFixed(2)}</td>
        <td>${l.total.toFixed(2)}</td>
      </tr>`;
  });

  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Facture #${nouvelleFacture.numero}</title>
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

        <h2>Facture #${nouvelleFacture.numero}</h2>
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
            ${lignesHTML}
          </tbody>
        </table>

        <p class="total">Total : ${nouvelleFacture.montant.toFixed(2)} €</p>

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
