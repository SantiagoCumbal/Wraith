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
import http from "http"
import {Server} from "socket.io"
import Mensaje from './models/Mensaje.js'

//Inicializaciones
const app = express()
dotenv.config()

//cloudinary para la base de datos
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : './uploads'
}))


app.use(session({
    secret: process.env.MONGODB_ATLAS, 
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

//Configuraciones
app.set('port', process.env.PORT || 3000) 

app.use(cors());
app.use(express.json()); //guarda la informacion del frontend en un archivo json para procesar el backend


// Rutas 
app.get('/',(req,res)=>{
    res.send("Server on")
})

//Rutas para administradores
app.use('/api',routerAdministrador)

// Rutas para jugadores
app.use('/api',routerJugadores)

//Ruta para los chats
app.use('/api', routerChat)

// Rutas
app.use('/api/auth', authRoutes);

app.get('/prueba', (req, res) => {
    res.send('<h2>Inicio</h2><a href="/api/auth/google">Google</a> | <a href="/api/auth/facebook">Facebook</a>');
});

app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/prueba');
    res.send(`<h2>Hola, ${req.user.name}</h2><a href="/auth/logout">Salir</a>`);
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});


// Generar nombre único para la sala
function getRoomName(u1, u2) {
  return [u1, u2].sort().join("_");
}

// Socket.IO
io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} se unió a la sala ${room}`);
  });

  socket.on("sendMessage", async (data) => {
    const nuevoMensaje = new Mensaje({
      remitenteId: data.remitenteId,
      destinatarioId: data.destinatarioId,
      mensaje: data.mensaje,
    });

    await nuevoMensaje.save();

    const room = getRoomName(data.remitenteId, data.destinatarioId);
    io.to(room).emit("receiveMessage", nuevoMensaje);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

// Manejo de una ruta que no sea encontrada
app.use((req,res)=>res.status(404).send("Endpoint no encontrado - 404"))

//Exportar la instancia
export  { app, server, io }

