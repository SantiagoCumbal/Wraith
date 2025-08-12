import Administrador from "../models/Administrador.js"
import { sendMailToRecoveryPasswordAdmin } from "../config/nodemailer.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import Jugadores from "../models/Jugador.js"
import mongoose from "mongoose"
import { v2 as cloudinary } from 'cloudinary'
import fs from "fs-extra"


const recuperarPassword = async (req,res)=>{
    const {email} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    const administradorBDD = await Administrador.findOne({email});
    if(!administradorBDD) return res.status(404).json(
        {msg:"Alerta no existe ningun administrador con esas credenciales"}
    )
    const token = administradorBDD.crearToken()
    administradorBDD.token=token
    await sendMailToRecoveryPasswordAdmin(email,token)
    await administradorBDD.save()
    res.status(200).json({
        msg:"Revisa tu correo electrónico para reestablecer tu cuenta"}
    )

}
const comprobarTokenPassword = async (req,res)=>{ 
    const {token} = req.params
    const administradorBDD = await Administrador.findOne({token})
    if(administradorBDD?.token !== token) return res.status(404).json(
        {msg:"Lo sentimos, no se puede validar la cuenta"}
    )

    await administradorBDD.save()
    res.status(200).json(
        {msg:"Token confirmado, ya puedes crear tu nuevo password"}
    ) 
}

const crearNuevaPassword = async (req,res)=>{
    const{password,confirmpassword} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    if(password !== confirmpassword) return res.status(404).json(
        {msg:"Lo sentimos, los passwords no coinciden"}
    )
    const administradorBDD = await Administrador.findOne({token:req.params.token})
    if(administradorBDD?.token !== req.params.token) return res.status(404).json(
        {msg:"Lo sentimos, error de validacion"}
    )
    administradorBDD.token = null
    administradorBDD.password = await administradorBDD.encrypPassword(password)
    await administradorBDD.save()
    res.status(200).json({msg:"Se obtuvo una nueva contraseña para el administrado con exito"}) 
}
const login = async(req,res)=>{

    const {email,password} = req.body
    if (Object.values(req.body).includes("")) return res.status(400).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    const administradorBDD = await Administrador.findOne({email}).select("-status -__v -token -updatedAt -createdAt")

    if(!administradorBDD) return res.status(404).json(
        {msg:"Este administrador no existe"}
    )
    const verificarPassword = await administradorBDD.matchPassword(password)

    if(!verificarPassword)res.status(401).json(
        {msg:"Contraseña incorrecta"}
    )
    const {nombre,apellido,username,_id,rol} = administradorBDD
    const token = crearTokenJWT(administradorBDD._id,administradorBDD.rol)

    res.status(200).json({
        token,
        nombre,
        apellido,
        username,
        _id,
        email:administradorBDD.email
    })

}
const perfil =(req,res)=>{
    const {token,confirmEmail,createdAt,updatedAt,__v,...datosPerfil} = req.administradorBDD
    res.status(200).json(datosPerfil)
}

const actualizarPerfil = async (req,res)=>{
    const {id} = req.params
    const {nombre,apellido,username,email} = req.body
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json(
        {msg:`Lo sentimos, debe ser un id válido`}
    )
    if (Object.values(req.body).includes("")) return res.status(400).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )

    const administradorBDD = await Administrador.findById(id)
    if(!administradorBDD) return res.status(404).json(
        {msg:`Lo sentimos, no existe el administrador`}
    )
    if (administradorBDD.email != email)
    {
        const administradorBDDMail = await Administrador.findOne({email})
        if (administradorBDDMail)
        {
            return res.status(404).json(
                {msg:`Lo sentimos, el email existe ya se encuentra registrado`}
            )  
        }
    }
    administradorBDD.nombre = nombre ?? administradorBDD.nombre
    administradorBDD.apellido = apellido ?? administradorBDD.apellido
    administradorBDD.username = username ?? administradorBDD.username
    administradorBDD.email = email ?? administradorBDD.email

    if (req.files?.imagen) {
            if (administradorBDD.avatarAdministradorID) {
                await cloudinary.uploader.destroy(administradorBDD.avatarAdministradorID);
            }
    
            const { secure_url, public_id } = await cloudinary.uploader.upload(
                req.files.imagen.tempFilePath,
                { folder: 'Administrador' }
            );
    
            administradorBDD.avatarAdministrador = secure_url;
            administradorBDD.avatarAdministradorID = public_id;
    
            await fs.unlink(req.files.imagen.tempFilePath);
        }

    await administradorBDD.save()
    res.status(200).json(administradorBDD)
}


const actualizarPassword = async (req,res)=>{
    const administradorBDD = await Administrador.findById(req.administradorBDD._id)
    if(!administradorBDD) return res.status(404).json(
        {msg:`Alerta este administrador no existe`}
    )
    const{presentpassword,newpassword} = req.body
    if (Object.values(req.body).includes("")) {
        return res.status(400).json(
            { msg: "Lo sentimos, debes llenar todos los campos" }
        );
    }
    const verificarPassword = await administradorBDD.matchPassword(presentpassword)
    if(!verificarPassword) return res.status(404).json(
        {msg:"Lo sentimos, La contraseña actual no es correcta"}
    )
    administradorBDD.password = await administradorBDD.encrypPassword(newpassword)
    await administradorBDD.save()
    res.status(200).json(
        {msg:"Contraseña actualizada correctamente"}
    )
}

const baneoJugador = async (req, res) => {
    const { id } = req.params
    if (!req.administradorBDD ||req.administradorBDD.rol !== "Administrador") {
        return res.status(403).json(
            { msg: "Acceso denegado: solo administradores pueden banear jugadores" }
        )
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(
            { msg: "Lo sentimos, debe ser un id válido" }
        )
    }
    const jugadorBDD = await Jugadores.findById(id);
    if (!jugadorBDD) {
        return res.status(404).json(
            { msg: "Jugador no encontrado" }
        )
    }

    if(jugadorBDD.status === false){
        return res.status(404).json(
            { msg: "Este Jugador ya se encuentra Baneado por comportamiento inapropiado" }
        )
    }

    jugadorBDD.status = false;
    await jugadorBDD.save();

    res.status(200).json(
        { msg: `El jugador ${jugadorBDD.username} ha sido baneado por comportamiento inapropiado` }
    )
}


export {
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevaPassword,
    login, 
    perfil,
    actualizarPerfil,
    actualizarPassword,
    baneoJugador
}