import jwt from "jsonwebtoken"
import Administrador from "../models/Administrador.js"
import Jugadores from "../models/Jugador.js"

const crearTokenJWT = (id, rol) => {

    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const verificarTokenJWT = async (req, res, next) => {

		const { authorization } = req.headers
		
    if (!authorization) return res.status(401).json({ msg: "Acceso denegado: token no proporcionado o inválido" })

    try {
        const token = authorization.split(" ")[1];
        const { id, rol } = jwt.verify(token,process.env.JWT_SECRET)
        if (rol === "jugador") {
            req.jugadorBDD = await Jugadores.findById(id).lean().select("-password")
            next()
        } else if (rol === "Administrador") {
            req.administradorBDD = await Administrador.findById(id).lean().select("-password")
            next()
        } 

    } catch (error) {
        return res.status(401).json({ msg: "Token inválido o expirado" });
    }
}


export { 
    crearTokenJWT,
    verificarTokenJWT 
}

