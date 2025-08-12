// test/Jugador.test.js
import { login } from '../src/controllers/Jugador_controller.js'
import Jugadores from '../src/models/Jugador.js'
import { crearTokenJWT } from '../src/middlewares/JWT.js'

// Mock de dependencias
jest.mock('../src/models/Jugador.js')
jest.mock('../src/middlewares/JWT.js')
jest.mock('../src/config/nodemailer.js', () => ({
  sendMailToRegister: jest.fn(),
  sendMailToRecoveryPassword: jest.fn(),
}))

describe('login', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: '123456'
      }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    jest.clearAllMocks()
  })

  test('debe retornar 400 si faltan campos', async () => {
    req.body.email = ''

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.any(String) })
    )
  })

  test('debe retornar 404 si no se encuentra el usuario', async () => {
    Jugadores.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    })

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Usuario no registrado' })
    )
  })

  test('debe retornar 401 si usuario no confirmado', async () => {
    const jugadorMock = { confirmEmail: false }
    Jugadores.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(jugadorMock)
    })

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('cuenta aun no ha sido verificada') })
    )
  })

  test('debe retornar 403 si cuenta suspendida', async () => {
    const jugadorMock = { confirmEmail: true, status: false }
    Jugadores.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(jugadorMock)
    })

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('suspendida') })
    )
  })

  test('debe retornar 401 si password es incorrecta', async () => {
    const jugadorMock = {
      confirmEmail: true,
      status: true,
      matchPassword: jest.fn().mockResolvedValue(false),
    }
    Jugadores.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(jugadorMock)
    })

    await login(req, res)

    expect(jugadorMock.matchPassword).toHaveBeenCalledWith(req.body.password)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Contraseña incorrecta' })
    )
  })

  test('debe retornar 200 con token y datos si login es correcto', async () => {
    const jugadorMock = {
      confirmEmail: true,
      status: true,
      matchPassword: jest.fn().mockResolvedValue(true),
      nombre: 'Juan',
      apellido: 'Perez',
      username: 'juan123',
      _id: '123456789',
      rol: 'jugador',
      email: 'test@example.com'
    }
    Jugadores.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(jugadorMock)
    })
    crearTokenJWT.mockReturnValue('token-falso')

    await login(req, res)

    expect(crearTokenJWT).toHaveBeenCalledWith(jugadorMock._id, jugadorMock.rol)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      token: 'token-falso',
      nombre: jugadorMock.nombre,
      apellido: jugadorMock.apellido,
      username: jugadorMock.username,
      _id: jugadorMock._id,
      email: jugadorMock.email
    })
  })

})
