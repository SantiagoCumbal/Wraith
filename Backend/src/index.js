import app from './server.js'
import connection from './database.js'
import http from 'http'
import { Server } from 'socket.io'
import Mensaje from './models/Mensaje.js'

connection()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
})



io.on('connection', (socket) => {
    console.log('Usuario conectado', socket.id)
    socket.on('enviar-mensaje-front-back', async (payload) => {
        try {
        // Por ejemplo, usando tu modelo Mensaje
        const nuevoMensaje = new Mensaje(payload)
        await nuevoMensaje.save()

        // Luego transmites el mensaje a los demás
        socket.broadcast.emit('enviar-mensaje-front-back', payload)
        } catch (error) {
        console.error('Error guardando mensaje:', error)
        }
    })
})



server.listen(app.get('port'),()=>{
    console.log(`Server ok on http://localhost:${app.get('port')}`);
})
