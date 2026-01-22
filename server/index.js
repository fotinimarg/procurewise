const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const { mongoose } = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user')

// Database connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Database Connected'))
    .catch((err) => console.log('Database Not Connected', err))

const app = express();

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(
    cors({
        credentials: true,
        origin: [
            "https://procurewise-tawny.vercel.app",
            "http://localhost:5173"
        ],
    })
)

// Session setup
app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// User authentication
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const searchRoutes = require('./routes/searchRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const importRoutes = require('./routes/importRoutes');

app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/imports', importRoutes);

app.listen(process.env.PORT || 8000, () => console.log('Server is running...'))
