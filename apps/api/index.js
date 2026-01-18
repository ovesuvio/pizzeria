require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user');

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'public/news');
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/static/news', express.static(UPLOAD_DIR));

// Opening hours config
const config = require('./src/config');

// In-memory stores fallback
const memory = {
  users: [],
  categories: [],
  products: [],
  discounts: [],
  orders: [],
  news: [],
};

function seedUsers() {
  if (memory.users.length === 0) {
    const hash = bcrypt.hashSync('Admin123', 10);
    memory.users.push({ _id: 'u_admin', email: 'ovesuviogp', phone: '07161-811727', passwordHash: hash, isAdmin: true });
  }
}
seedUsers();

let db = { useMemory: true };
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI).then(async () => {
    db.useMemory = false;
    console.log('MongoDB connesso');
    try {
      const email = 'ovesuviogp';
      let admin = await User.findOne({ email });
      if (!admin) {
        const hash = bcrypt.hashSync('Admin123', 10);
        admin = await User.create({ firstName: 'Admin', lastName: 'O Vesuvio', email, phone: '07161-811727', address: '', passwordHash: hash, isAdmin: true, privacyConsent: true, privacyConsentAt: new Date(), privacyPolicyVersion: process.env.PRIVACY_VERSION || 'v1' });
        console.log('Admin creato in MongoDB:', email);
      }
    } catch (e) {
      console.log('Errore creazione admin in MongoDB:', e.message);
    }
  }).catch((err) => {
    console.log('MongoDB non disponibile, uso memoria:', err.message);
  });
}

// Seed definitivo: elimina prodotti esistenti e imposta il nuovo catalogo
function seedDefinitive() {
  // Categorie definitive
  const categories = [
    { _id: 'cat_pizza_30cm', name: 'Pizza 30 cm Ø' },
    { _id: 'cat_pasta', name: 'Pasta' },
    { _id: 'cat_insalate', name: 'Salate (Insalate)' },
  ];
  memory.categories = categories;

  // Prodotti definitivi
  const products = [
    // Pizza 30 cm Ø
    { _id: 'p_1', name: 'Margherita', description: '-', price: 9.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_2', name: 'Salami', description: 'Salami', price: 10.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_3', name: 'Prosciutto', description: 'Schinken', price: 10.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_4', name: 'Funghi', description: 'Champignons', price: 10.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_5', name: 'Portafoglio', description: 'Champignons, Schinken, Artischocken', price: 11.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_6', name: 'Venezia', description: 'Thunfisch, Zwiebeln, Champignons, Artischocken', price: 11.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_7', name: 'Capri', description: 'Salami, Paprika, Champignons', price: 11.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_8', name: 'Ischia', description: 'Salami, Peperoni, Scharf', price: 11.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_9', name: 'Sorrento', description: 'Salami, Schinken', price: 11.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_10', name: 'Hawaii', description: 'Schinken, Ananas', price: 11.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_11', name: 'Tonno', description: 'Thunfisch, Zwiebeln', price: 11.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_12', name: 'Quattro Formaggi', description: 'Vier Käsesorten', price: 11.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_13', name: 'Quattro Stagioni', description: 'Champignons, Paprika, Brokkoli, Knoblauch, Artischocken', price: 12.50, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_14', name: 'Parma', description: 'Parmaschinken, Rucola, Parmesan', price: 13.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_15', name: 'Gamberetti', description: 'Shrimps, Knoblauch', price: 13.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_16', name: 'Capricciosa', description: 'Champignons, Salami, Schinken, Artischocken', price: 13.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_17', name: 'Pompei', description: 'Oliven, Zwiebeln, Schinken, Artischocken', price: 13.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_18', name: 'Mare', description: 'Meeresfrüchte, Knoblauch', price: 13.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_19', name: 'Calabrese', description: 'Champignons, Oliven, Zwiebeln, Artischocken, Salami, Pikant', price: 13.00, categoryId: 'cat_pizza_30cm', available: true },
    { _id: 'p_20', name: 'Jura', description: 'Champignons, Paprika, Salami, Oliven, Sardellen', price: 13.00, categoryId: 'cat_pizza_30cm', available: true },

    // Pasta
    { _id: 'p_21', name: 'Rigatoni / Spaghetti Napoli', description: 'mit Tomatensosse', price: 11.00, categoryId: 'cat_pasta', available: true },
    { _id: 'p_22', name: 'Rigatoni / Spaghetti Bolognese', description: 'mit Hackfleischsosse', price: 12.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_23', name: 'Rigatoni al Forno', description: 'Überbacken mit Bolognese', price: 12.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_24', name: 'Rigatoni Jura', description: 'Schinken, Sahne, Käse', price: 12.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_25', name: 'Lasagne al Forno', description: 'Überbacken mit Bolognese', price: 12.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_26', name: 'Spaghetti Carbonara', description: 'Ei, Parmesan, Schinken, Sahne', price: 12.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_27', name: 'Spaghetti Marinara', description: 'Meeresfrüchte', price: 14.00, categoryId: 'cat_pasta', available: true },
    { _id: 'p_28', name: 'Tortellini Panna', description: 'Schinken, Sahne, Käse', price: 12.00, categoryId: 'cat_pasta', available: true },
    { _id: 'p_29', name: 'Tortellini al Forno', description: 'Überbacken', price: 12.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_30', name: 'Tagliatelle Salmone', description: 'Lachs, Tomatensosse, Sahne', price: 14.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_31', name: 'Tagliatelle Mare Monti', description: 'Garnelen, Pilze, Tomatensosse', price: 14.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_32', name: 'Tagliatelle Funghi Porcini', description: 'Steinpilze, Knoblauch', price: 14.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_33', name: 'Tagliatelle Salsiccia', description: 'Ital. Bratwurst, Pilze, Kirschtomaten', price: 14.50, categoryId: 'cat_pasta', available: true },
    { _id: 'p_34', name: 'Gnocchi Quattro Formaggi', description: 'Vier Käsesorten, Sahne', price: 12.00, categoryId: 'cat_pasta', available: true },
    { _id: 'p_35', name: 'Gnocchi Salmone', description: 'Spinat, Sahne, Käse', price: 12.00, categoryId: 'cat_pasta', available: true },

    // Salate (Insalate)
    { _id: 'p_36', name: 'Grüner Salat', description: '-', price: 5.50, categoryId: 'cat_insalate', available: true },
    { _id: 'p_37', name: 'Tomatensalat', description: 'mit Zwiebeln', price: 7.50, categoryId: 'cat_insalate', available: true },
    { _id: 'p_38', name: 'Salat Caprese', description: 'mit Tomaten und Mozzarella', price: 9.50, categoryId: 'cat_insalate', available: true },
    { _id: 'p_39', name: 'Gemischter Salat', description: 'mit Tomaten, Zwiebeln, Gurken, Paprika und Oliven', price: 9.50, categoryId: 'cat_insalate', available: true },
    { _id: 'p_40', name: 'Italienischer Salat', description: 'mit Tomaten, Zwiebeln, Gurken, Paprika und Schinken', price: 10.50, categoryId: 'cat_insalate', available: true },
    { _id: 'p_41', name: 'Salat Jura', description: 'mit Tomaten, Zwiebeln, Gurken, Eier, Paprika, Oliven, Schinken', price: 13.50, categoryId: 'cat_insalate', available: true },
    { _id: 'p_42', name: 'Salat Fitness', description: 'mit Tomaten, Zwiebeln, Gurken, Paprika, Mais und Putenstreifen', price: 13.50, categoryId: 'cat_insalate', available: true },
    { _id: 'p_43', name: 'Beilagesalat', description: 'Insalata di contorno', price: 5.50, categoryId: 'cat_insalate', available: true },
  ];

  // Assegna sottocategorie derivate da nome e categoria
  function deriveSubcategory(p) {
    const n = p.name.toLowerCase();
    if (p.categoryId === 'cat_pasta') {
      if (n.includes('rigatoni')) return 'Rigatoni';
      if (n.includes('spaghetti')) return 'Spaghetti';
      if (n.includes('tagliatelle')) return 'Tagliatelle';
      if (n.includes('gnocchi')) return 'Gnocchi';
      if (n.includes('tortellini')) return 'Tortellini';
      if (n.includes('lasagne')) return 'Lasagne';
      return 'Pasta';
    }
    if (p.categoryId === 'cat_insalate') {
      const semplici = ['grüner salat','tomatensalat','beilagesalat','salat caprese'];
      if (semplici.includes(n)) return 'Semplici';
      return 'Speciali';
    }
    if (p.categoryId === 'cat_pizza_30cm') {
      const mare = ['mare','gamberetti'];
      if (mare.includes(n)) return 'Mare';
      const piccanti = ['calabrese','ischia'];
      if (piccanti.includes(n)) return 'Piccanti';
      const classiche = ['margherita','salami','prosciutto','funghi','hawaii','tonno','quattro formaggi'];
      if (classiche.includes(n)) return 'Classiche';
      return 'Speciali';
    }
    return undefined;
  }
  memory.products = products.map((p) => ({ ...p, subcategory: deriveSubcategory(p) }));
}
seedDefinitive();

// Attach io to req for order updates
app.use((req, res, next) => { req.io = io; next(); });

// Routes
const authRoutes = require('./src/routes/auth')(memory, db);
const categoryRoutes = require('./src/routes/categories')(memory, db);
const productRoutes = require('./src/routes/products')(memory, db);
const orderRoutes = require('./src/routes/orders')(memory, db);
const discountRoutes = require('./src/routes/discounts')(memory, db);
const newsRoutes = require('./src/routes/news')(memory, db);
const userRoutes = require('./src/routes/users')(memory, db);

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/discounts', discountRoutes);
app.use('/news', newsRoutes);
app.use('/users', userRoutes);

app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'O Vesuvio API', hours: config.hours });
});

io.on('connection', (socket) => {
  console.log('WS connesso:', socket.id);
});

server.listen(PORT, () => {
  console.log(`API avviata su http://localhost:${PORT}`);
});