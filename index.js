const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const clientsFile = path.join(__dirname, "clients.json");

// =================== UTILITAIRES ===================
function lireClients() {
  if (!fs.existsSync(clientsFile)) return [];
  return JSON.parse(fs.readFileSync(clientsFile, "utf8"));
}

function enregistrerClients(clients) {
  fs.writeFileSync(clientsFile, JSON.stringify(clients, null, 2));
}

// Coordonnées fixes de l’entreprise
const entreprise = {
  nom: "Atelier Réparation",
  adresse: "58 chemin de la lionne, 38460 Trept",
  telephone: "04 74 33 63 91",
  email: "contact@atelier-reparation.fr",
  siret: "XXXXXXXXXXXXX"
};

// =================== ACCUEIL ===================
app.get("/", (req, res) => {
  res.send(`
    <h1>Bienvenue sur ${entreprise.nom} 📱</h1>
    <ul>
      <li><a href="/clients">👥 Ajouter un client</a></li>
      <li><a href="/clients/liste">📂 Liste des clients</a></li>
      <li><a href="/factures">🧾 Créer une facture</a></li>
      <li><a href="/reparations">🔧 Ajouter une réparation</a></li>
    </ul>
  `);
});

// =================== CLIENTS ===================
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

// 📂 Liste des clients
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

// 📂 Dossier client
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
        <p><b>Facture #${f.numero}</b> - ${f.montant.toFixed(2)} € (${f.date})</p>
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

// =================== FACTURES ===================
app.get("/factures", (req, res) => {
  res.sendFile(path.join(__dirname, "factures.html"));
});

app.post("/factures", (req, res) => {
  const { client, numero, designation, quantite, prix } = req.body;
  let clients = lireClients();

  const clientTrouve = clients.find(c => c.nom.toLowerCase() === client.toLowerCase());
  if (!clientTrouve) {
    return res.send(`<h2>❌ Client "${client}" introuvable</h2><a href="/clients">Ajouter un client</a>`);
  }

  let lignes = [];
  let totalGlobal = 0;

  for (let i = 0; i < designation.length; i++) {
    const qte = parseFloat(quantite[i]) || 0;
    const pu = parseFloat(prix[i]) || 0;
    const total = qte * pu;
    totalGlobal += total;

    lignes.push({ designation: designation[i], quantite: qte, prix: pu, total: total });
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
            <h2>${entreprise.nom}</h2>
            <p>${entreprise.adresse}<br>
            📞 ${entreprise.telephone}<br>
            ✉️ ${entreprise.email}<br>
            SIRET : ${entreprise.siret}</p>
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

// =================== RÉPARATIONS ===================
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

// =================== LANCEMENT ===================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
