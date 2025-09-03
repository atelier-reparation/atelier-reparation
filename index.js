const express = require("express");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

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

  res.send(`<h2>✅ Client ${nom} enregistré</h2>
    <p><b>Email :</b> ${email}</p>
    <p><b>Téléphone :</b> ${telephone}</p>
    <p><a href="/clients">⬅ Retour</a> | <a href="/">🏠 Accueil</a></p>`);
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
    <h2>🧾 Factures</h2>`;

  if (client.factures.length === 0) {
    html += "<p>Aucune facture</p>";
  } else {
    client.factures.forEach(f => {
      html += `<div style="border:1px solid #ccc; padding:10px; margin:5px;">
        <p><b>Facture #${f.numero}</b> - ${f.montant} € (${f.date})</p>
        <button onclick="window.print()">🖨️ Imprimer</button>
        <form action="/envoyer-facture" method="post" style="display:inline;">
          <input type="hidden" name="idClient" value="${client.id}">
          <input type="hidden" name="idFacture" value="${f.id}">
          <button type="submit">📧 Envoyer par mail</button>
        </form>
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

// ================= FACTURES =================
app.get("/factures", (req, res) => {
  res.sendFile(path.join(__dirname, "factures.html"));
});

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
    date: new Date().toLocaleDateString()
  };

  clientTrouve.factures.push(nouvelleFacture);
  enregistrerClients(clients);

  res.send(`<h1>✅ Facture enregistrée</h1>
    <p><b>Client :</b> ${clientTrouve.nom}</p>
    <p><b>Numéro :</b> ${numero}</p>
    <p><b>Montant :</b> ${montant} €</p>
    <button onclick="window.print()">🖨️ Imprimer</button>
    <p><a href="/factures">⬅ Retour</a></p>`);
});

// ================= ENVOYER FACTURE PAR EMAIL =================
app.post("/envoyer-facture", (req, res) => {
  const { idClient, idFacture } = req.body;
  let clients = lireClients();
  const client = clients.find(c => c.id === parseInt(idClient));

  if (!client) return res.send("❌ Client introuvable.");
  const facture = client.factures.find(f => f.id === parseInt(idFacture));
  if (!facture) return res.send("❌ Facture introuvable.");

  // 📧 Configuration du mail
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tonadresse@gmail.com", // à remplacer
      pass: "tonmotdepasse" // à remplacer
    }
  });

  const mailOptions = {
    from: "Atelier Réparation <tonadresse@gmail.com>",
    to: client.email,
    subject: `Votre facture #${facture.numero}`,
    text: `Bonjour ${client.nom},\n\nVoici votre facture : ${facture.montant} € du ${facture.date}.\n\nMerci de votre confiance.\n\nAtelier Réparation`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(err);
      return res.send("❌ Erreur lors de l'envoi de l'email.");
    }
    res.send(`✅ Facture envoyée à ${client.email}<br><a href="/clients/${client.id}">⬅ Retour au dossier</a>`);
  });
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
    return res.send(`<h2>❌ Client "${client}" introuvable</h2><a href="/clients">Ajouter un client</a>`);
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

  res.send(`<h1>✅ Réparation enregistrée</h1>
    <p><b>Client :</b> ${clientTrouve.nom}</p>
    <p><b>Appareil :</b> ${appareil}</p>
    <p><b>Problème :</b> ${probleme}</p>
    <p><b>Statut :</b> ${statut}</p>
    <p><a href="/reparations">⬅ Retour</a></p>`);
});

// ================== LANCEMENT ==================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
 
