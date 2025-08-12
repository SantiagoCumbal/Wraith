import Mensaje from "../models/Mensaje.js";
import Usuario from "../models/Jugador.js";

const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

const getMensajes = async (req, res) => {
  const { u1, u2 } = req.params;
  try {
    const mensajes = await Mensaje.find({
      $or: [
        { remitenteId: u1, destinatarioId: u2 },
        { remitenteId: u2, destinatarioId: u1 },
      ],
    }).sort({ fecha: 1 });
    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
};

const postMensaje = async (req, res) => {
  const { remitenteId, destinatarioId, mensaje } = req.body;
  try {
    const nuevo = new Mensaje({ remitenteId, destinatarioId, mensaje });
    await nuevo.save();
    res.json(nuevo);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar mensaje" });
  }
};

export {
    getUsuarios,
    getMensajes,
    postMensaje
}
