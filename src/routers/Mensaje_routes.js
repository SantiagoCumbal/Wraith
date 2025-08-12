import {Router} from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import {getUsuarios, getMensajes, postMensaje } from '../controllers/Mensaje_controller.js'


const router = Router()
router.get("/usuarios", verificarTokenJWT, getUsuarios);
router.get("/mensajes/:u1/:u2", verificarTokenJWT, getMensajes);
router.post("/mensajes", verificarTokenJWT, postMensaje);

export default router