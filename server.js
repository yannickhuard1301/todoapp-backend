const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
const mongoUri = process.env.MONGO_URI || 
  "mongodb://yannickhuard1301:Leonie2022@todoapp-shard-00-00.thfi6.mongodb.net:27017,todoapp-shard-00-01.thfi6.mongodb.net:27017,todoapp-shard-00-02.thfi6.mongodb.net:27017/todoapp?ssl=true&replicaSet=atlas-4v0a3t-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

// Schémas avec noms de collections personnalisés
const Utilisateur = mongoose.model('Utilisateur', new mongoose.Schema({
  nom: String,
  email: String,
  password: String,
  familleId: String,
  role: String,
  photoProfil: String
}), 'utilisateurs');

const ModeleTache = mongoose.model('ModeleTache', new mongoose.Schema({
  titre: String,
  description: String,
  typeRecompense: String,
  valeurRecompense: String,
  enfant: String,
  lundi: Boolean,
  mardi: Boolean,
  mercredi: Boolean,
  jeudi: Boolean,
  vendredi: Boolean,
  samedi: Boolean,
  dimanche: Boolean,
}), 'modeles_taches');

const Validation = mongoose.model('Validation', new mongoose.Schema({
  tacheId: String,
  titre: String,
  description: String,
  recompenseType: String,
  recompenseValeur: String,
  enfant: String,
  estValideeParEnfant: Boolean,
  estApprouvee: Boolean,
  date: String,
  preuve: String
}), 'validationsTaches');

// Routes AUTH
app.post('/login', async (req, res) => {
  const { identifiant, password } = req.body;
  const user = await Utilisateur.findOne({
    $or: [{ email: identifiant }, { nom: identifiant }],
    password,
  });
  user ? res.json(user) : res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
});

// Routes UTILISATEURS
app.get('/utilisateurs/famille/:familleId', async (req, res) => {
  try {
    const users = await Utilisateur.find({ familleId: req.params.familleId });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur : ' + e.message });
  }
});

app.get('/utilisateurs/exists', async (req, res) => {
  const { nom, email } = req.query;
  try {
    const user = await Utilisateur.findOne({
      $or: [{ nom }, { email }],
    });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la vérification.' });
  }
});

app.post('/utilisateurs', async (req, res) => {
  try {
    const newUser = new Utilisateur(req.body);
    await newUser.save();
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de l’ajout : ' + e.message });
  }
});

app.put('/utilisateurs/:id', async (req, res) => {
  try {
    await Utilisateur.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur mise à jour : ' + e.message });
  }
});

app.put('/utilisateurs/:id/photo', async (req, res) => {
  try {
    const { photoProfil } = req.body;
    await Utilisateur.findByIdAndUpdate(req.params.id, { photoProfil });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur mise à jour photo : " + e.message });
  }
});

app.delete('/utilisateurs/:id', async (req, res) => {
  try {
    await Utilisateur.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur suppression utilisateur : " + e.message });
  }
});

// Routes MODELES DE TACHES
app.get('/modeles-taches', async (req, res) => {
  try {
    const modeles = await ModeleTache.find();
    res.json(modeles);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des modèles.' });
  }
});

app.post('/modeles', async (req, res) => {
  try {
    const modele = new ModeleTache(req.body);
    await modele.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l’ajout du modèle' });
  }
});

app.put('/modeles_taches/:id', async (req, res) => {
  try {
    await ModeleTache.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur mise à jour : ' + e.message });
  }
});

app.delete('/modeles_taches/:id', async (req, res) => {
  try {
    await ModeleTache.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur suppression : ' + e.message });
  }
});

// Routes VALIDATIONS
app.get('/validations', async (req, res) => {
  try {
    const validations = await Validation.find();
    res.json(validations);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des validations.' });
  }
});

app.post('/validation', async (req, res) => {
  const { tacheId, titre, description, recompenseType, recompenseValeur, enfant, estValideeParEnfant, estApprouvee, date, preuve } = req.body;
  try {
    const existe = await Validation.findOne({
      tacheId,
      enfant,
      date: { $regex: `^${date.substring(0, 10)}` },
    });
    if (existe) {
      return res.status(200).json({ alreadyExists: true });
    }
    const nouvelleValidation = new Validation({
      tacheId,
      titre,
      description,
      recompenseType,
      recompenseValeur,
      enfant,
      estValideeParEnfant: true,
      estApprouvee: false,
      date,
      preuve,
    });
    await nouvelleValidation.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de l’ajout de la validation : ' + e.message });
  }
});

app.post('/approuver/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validation = await Validation.findById(id);
    if (!validation) return res.status(404).json({ error: "Validation non trouvée" });
    validation.estApprouvee = true;
    await validation.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de l’approbation.' });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  const isRender = process.env.RENDER === 'true';
  const baseUrl = isRender
    ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
    : `http://localhost:${port}`;
  console.log(`🚀 Serveur backend lancé sur ${baseUrl}`);
});
