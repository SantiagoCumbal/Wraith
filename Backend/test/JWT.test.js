import { crearTokenJWT, verificarTokenJWT } from '../src/middlewares/JWT.js';
import Jugadores from '../src/models/Jugador.js';
import Administrador from '../src/models/Administrador.js';

process.env.JWT_SECRET = 'mi_secreto_secreto';

jest.mock('../src/models/Jugador.js');
jest.mock('../src/models/Administrador.js');

describe('verificarTokenJWT()', () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería validar token de jugador y llamar a next()', async () => {
    const token = crearTokenJWT('jugador123', 'jugador');
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    // Mock con encadenamiento .lean().select()
    const jugadorMock = { _id: 'jugador123', nombre: 'Juan' };
    Jugadores.findById.mockReturnValue({
      lean: () => ({
        select: () => Promise.resolve(jugadorMock),
      }),
    });

    await verificarTokenJWT(req, res, next);

    expect(Jugadores.findById).toHaveBeenCalledWith('jugador123');
    expect(req.jugadorBDD).toEqual(jugadorMock);
    expect(next).toHaveBeenCalled();
  });

  test('debería validar token de administrador y llamar a next()', async () => {
    const token = crearTokenJWT('admin456', 'Administrador');
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    // Mock con encadenamiento .lean().select()
    const administradorMock = { _id: 'admin456', nombre: 'Admin' };
    Administrador.findById.mockReturnValue({
      lean: () => ({
        select: () => Promise.resolve(administradorMock),
      }),
    });

    await verificarTokenJWT(req, res, next);

    expect(Administrador.findById).toHaveBeenCalledWith('admin456');
    expect(req.administradorBDD).toEqual(administradorMock);
    expect(next).toHaveBeenCalled();
  });

  test('debería devolver error si no se proporciona token', async () => {
    const req = {
      headers: {},
    };

    await verificarTokenJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Acceso denegado: token no proporcionado o inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  test('debería devolver error si token es inválido', async () => {
    const req = {
      headers: {
        authorization: 'Bearer token_invalido',
      },
    };

    await verificarTokenJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });
});
