import Mensaje from '../models/Mensaje.js'
import mongoose from "mongoose"

const enviarMensaje = async (req, res) => {
    const receptorId = req.params.id  
    const emisorId = req.jugadorBDD._id  
    const { mensaje } = req.body

    if (!mensaje) return res.status(404).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )

    if (!mongoose.Types.ObjectId.isValid(receptorId)) {
        return res.status(400).json(
            { msg: "Lo sentimos, debe ser un id válido" }
        )
    }

    const chatId = [emisorId.toString(), receptorId.toString()].sort().join("_")
    const nuevoMensaje = new Mensaje({
        chatId,
        mensaje,
        emisorId,
        receptorId
    })

    await nuevoMensaje.save()
    res.status(200).json(
        { msg: "Mensaje enviado correctamente"}
    )

}

const obtenerMensajes = async (req, res) => {
    const receptorId = req.params.id
    const emisorId = req.jugadorBDD._id
    if (!mongoose.Types.ObjectId.isValid(receptorId)) {
        return res.status(400).json(
            { msg: "Lo sentimos, debe ser un id válido" }
        )
    }
    const chatId = [emisorId.toString(), receptorId.toString()].sort().join("_")
    const mensajes = await Mensaje.find({ chatId }).sort({ createdAt: 1 })
    res.status(200).json(mensajes)

}



export {
    enviarMensaje,
    obtenerMensajes
}