import express from "express"; //framework
import dotenv from "dotenv";
import cors from "cors"; //sirve para conectar el backend y frontend con codigo de area
import routerJugadores from './routers/Jugador_routes.js'
import routerAdministrador from './routers/Administrador_routes.js'
import routerChat from './routers/Mensaje_routes.js'
import cloudinary from 'cloudinary'
import fileUpload from "express-fileupload"
import session from "express-session";
import passport from "passport";
import authRoutes from "./routers/auth.js"
import './config/passport.js';

//Inicializaciones
const app = express()
dotenv.config()

//cloudinary para la base de datos
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configuraciones generales
app.use(cors());

// Para interpretar bodies JSON y formularios urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para manejar uploads con archivos temporales
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp'   
}));

app.use(session({
    secret: process.env.MONGODB_ATLAS, 
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Configuraciones adicionales
app.set('port', process.env.PORT || 3000);

// Rutas básicas
app.get('/', (req, res) => {
    res.send("Server on");
});

// Rutas para administradores
app.use('/api', routerAdministrador);

// Rutas para jugadores
app.use('/api', routerJugadores);

// Rutas para los chats
app.use('/api', routerChat);

// Rutas de autenticación
app.use('/auth', authRoutes);

app.get('/prueba', (req, res) => {
    res.send('<h2>Inicio</h2><a href="/auth/google">Google</a> | <a href="/auth/facebook">Facebook</a>');
});

app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/prueba');
    res.send(`<h2>Hola, ${req.user.name}</h2><a href="/auth/logout">Salir</a>`);
});

// Manejo de una ruta que no sea encontrada
app.use((req,res) => res.status(404).send("Endpoint no encontrado - 404"));

//Exportar la instancia
export default app;

//EL uso del archivo no es muy usado pero es necesario
