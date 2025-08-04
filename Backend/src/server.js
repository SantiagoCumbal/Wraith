// app.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fileUpload from "express-fileupload";
import session from "express-session";
import passport from "passport";

import routerJugadores from './routers/Jugador_routes.js';
import routerAdministrador from './routers/Administrador_routes.js';
import routerChat from './routers/Mensaje_routes.js';
import authRoutes from "./routers/auth.js";
import './config/passport.js';
import cloudinary from 'cloudinary';

// Inicialización
const app = express();
dotenv.config();

// Obtener la ruta absoluta actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware para archivos (usa carpeta dentro del proyecto)
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp')  // ⚠️ TEMP LOCAL
}));

// Asegúrate de que la carpeta exista
import fs from 'fs';
const tempDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Middleware de sesión y passport
app.use(session({
    secret: process.env.MONGODB_ATLAS,
    saveUninitialized: false,
    resave: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Configuraciones
app.set('port', process.env.PORT || 3000);
app.use(cors());

// 🧠 Agregar estos 2 middleware ANTES de las rutas:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
    res.send("Server on");
});

app.use('/api', routerAdministrador);
app.use('/api', routerJugadores);
app.use('/api', routerChat);
app.use('/auth', authRoutes);

app.get('/prueba', (req, res) => {
    res.send('<h2>Inicio</h2><a href="/auth/google">Google</a> | <a href="/auth/facebook">Facebook</a>');
});

app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/prueba');
    res.send(`<h2>Hola, ${req.user.name}</h2><a href="/auth/logout">Salir</a>`);
});

// Manejo de rutas no encontradas
app.use((req, res) => res.status(404).send("Endpoint no encontrado - 404"));

export default app;