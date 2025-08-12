import {Router} from 'express'
import {recuperarPassword, comprobarTokenPassword, crearNuevaPassword, login, perfil, actualizarPerfil, actualizarPassword, baneoJugador} from '../controllers/Administrador_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'

const router = Router()
router.post('/recuperarpasswordAdmin',recuperarPassword)
router.get('/recuperarpasswordAdmin/:token',comprobarTokenPassword)
router.post('/nuevopasswordAdmin/:token',crearNuevaPassword)
router.post('/login/administrador',login)
router.get('/perfil/administrador',verificarTokenJWT,perfil)
router.put('/administrador/:id',verificarTokenJWT,actualizarPerfil)
router.put('/administrador/actualizarpassword/:id',verificarTokenJWT,actualizarPassword)
router.delete('/jugador/banear/:id',verificarTokenJWT,baneoJugador)

export default router