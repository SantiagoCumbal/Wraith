import {Router} from 'express'
import {comprobarTokenPassword, confirmarEmail, recuperarPassword, registro, crearNuevaPassword, login, perfil, actualizarPerfil, actualizarPassword,actualizarImagenPerfil, listarJugadores, detalleJugador, eliminarCuentaJugador, donarJugador} from '../controllers/Jugador_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'

const router = Router()

router.post('/registro',registro)
router.get('/confirmar/:token',confirmarEmail)
router.post('/recuperarpassword',recuperarPassword)
router.get('/recuperarpassword/:token',comprobarTokenPassword)
router.post('/nuevopassword/:token',crearNuevaPassword)
router.post('/login',login)
router.get('/perfil',verificarTokenJWT,perfil)
router.put('/jugador/:id',verificarTokenJWT,actualizarPerfil)
router.put('/jugador/actualizarpassword/:id',verificarTokenJWT,actualizarPassword)
router.put('/jugador/imagen/:id',verificarTokenJWT, actualizarImagenPerfil);
router.get('/ranking',verificarTokenJWT, listarJugadores)
router.get('/detalle/:id',verificarTokenJWT, detalleJugador)
router.delete('/jugador/eliminar/:id', verificarTokenJWT, eliminarCuentaJugador)
router.post('/jugador/donar', verificarTokenJWT, donarJugador)

export default router