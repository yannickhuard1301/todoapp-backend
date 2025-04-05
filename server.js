// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || "mongodb://yannickhuard1301:Leonie2022@todoapp-shard-00-00.thfi6.mongodb.net:27017,todoapp-shard-00-01.thfi6.mongodb.net:27017,todoapp-shard-00-02.thfi6.mongodb.net:27017/todoapp?ssl=true&replicaSet=atlas-4v0a3t-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch((err) => console.error('❌ Erreur MongoDB :', err));

// Schémas
const User = mongoose.model('User', new mongoose.Schema({
  nom: String,
  email: String,
  password: String,
  familleId: String,
  role: String,
}));

const Tache = mongoose.model('Tache', new mongoose.Schema({
  titre: String,
  description: String,
  enfantId: String,
  familleId: String,
  date: String,
}));

const Validation = mongoose.model('Validation', new mongoose.Schema({
  tacheId: String,
  enfantId: String,
  date: String,
  preuve: String,
  approuvee: Boolean,
}));

// Routes
app.post('/login', async (req, res) => {
  const { identifiant, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: identifiant }, { nom: identifiant }],
    password,
  });
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
  }
});

app.get('/taches/:enfantId', async (req, res) => {
  const { enfantId } = req.params;
  const taches = await Tache.find({ enfantId });
  res.json(taches);
});

app.post('/validation', async (req, res) => {
  const { tacheId, enfantId, date, preuve } = req.body;
  const newValidation = new Validation({ tacheId, enfantId, date, preuve, approuvee: false });
  await newValidation.save();
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`🚀 Serveur backend lancé sur http://localhost:${port}`);
});
