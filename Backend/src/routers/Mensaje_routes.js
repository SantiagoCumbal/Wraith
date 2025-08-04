import {Router} from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { enviarMensaje, obtenerMensajes } from '../controllers/Mensaje_controller.js'


const router = Router()
router.post('/chat/:id',verificarTokenJWT,enviarMensaje)
router.get('/chat/historial/:id',verificarTokenJWT,obtenerMensajes)

export default router