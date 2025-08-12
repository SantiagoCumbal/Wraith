import { sendMailToRegister, sendMailToRecoveryPassword } from "../config/nodemailer.js"
import Jugadores from "../models/Jugador.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import mongoose from "mongoose"
import { v2 as cloudinary } from 'cloudinary'
import fs from "fs-extra"
import { Stripe } from "stripe"
const stripe = new Stripe(`${process.env.STRIPE_PRIVATE_KEY}`)

const registro = async (req,res)=>{
    const {email,password} = req.body

    if (Object.values(req.body).includes("")) return res.status(400).json({
        msg:"Lo sentimos, debes llenar todos los campos"
    })

    const verificarEmailBDD = await Jugadores.findOne({ email });
    if (verificarEmailBDD) {
        return res.status(400).json(
            { msg: "Lo sentimos, el email ya se encuentra registrado" }
        );
    }

    //Imagenes
    const nuevojugador = new Jugadores(req.body)

    if(req.files?.imagen){
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.imagen.tempFilePath,{folder:'Jugadores'})
        nuevojugador.avatarJugador = secure_url
        nuevojugador.avatarJugadorID = public_id
        await fs.unlink(req.files.imagen.tempFilePath)
    }

    if (req.body?.avatarJugadorIA) {
        const base64Data = req.body.avatarJugadorIA.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const { secure_url } = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'Jugadores', resource_type: 'auto' }, (error, response) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(response)
                }
            })
            stream.end(buffer)
        })
            nuevojugador.avatarJugadorIA = secure_url
    }

    nuevojugador.password = await nuevojugador.encrypPassword(password)

    const token = nuevojugador.crearToken()
    await sendMailToRegister(email,token)


    await nuevojugador.save()
    res.status(200).json(
        {msg:"Revisa tu correo electrónico para confirmar tu cuenta"}
    )
}


const confirmarEmail = async (req,res)=>{
    if(!(req.params.token)) 
        return res.status(400).json({msg:"Lo sentimos, no se puede validar la cuenta"
    })

    const jugadorBDD = await Jugadores.findOne({token:req.params.token});

    if(!jugadorBDD?.token) 
        return res.status(404).json({msg:"La cuenta ya ha sido confirmada"
    })

    jugadorBDD.token = null
    jugadorBDD.confirmEmail=true

    await jugadorBDD.save()
    res.status(200).json({msg:"Token confirmado, ya puedes iniciar sesión"}) 
}

const recuperarPassword = async (req,res)=>{
    const {email} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    const jugadorBDD = await Jugadores.findOne({email});
    if(!jugadorBDD) return res.status(404).json(
        {msg:"Lo sentimos, el usuario no se encuentra registrado"}
    )
    const token = jugadorBDD.crearToken()
    jugadorBDD.token=token
    await sendMailToRecoveryPassword(email,token)
    await jugadorBDD.save()
    res.status(200).json({
        msg:"Revisa tu correo electrónico para reestablecer tu cuenta"}
    )

}
const comprobarTokenPassword = async (req,res)=>{ 
    const {token} = req.params
    const jugadorBDD = await Jugadores .findOne({token})
    if(jugadorBDD?.token !== token) return res.status(404).json(
        {msg:"Lo sentimos, no se puede validar la cuenta"}
    )

    await jugadorBDD.save()
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
    const jugadorBDD = await Jugadores.findOne({token:req.params.token})
    if(jugadorBDD?.token !== req.params.token) return res.status(404).json(
        {msg:"Lo sentimos, no se puede validar la cuenta"}
    )
    jugadorBDD.token = null
    jugadorBDD.password = await jugadorBDD.encrypPassword(password)
    await jugadorBDD.save()
    res.status(200).json({msg:"Felicitaciones, ya puedes iniciar sesión con tu nuevo password"}) 
}

const login = async(req,res)=>{

    const {email,password} = req.body
    if (Object.values(req.body).includes("")) return res.status(400).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    const jugadorBDD = await Jugadores.findOne({email}).select("-__v -token -updatedAt -createdAt")

    if(jugadorBDD?.confirmEmail === false) return res.status(401).json(
        {msg:"Lo sentimos tu cuenta aun no ha sido verificada"}
    )

    if(jugadorBDD?.status === false){
        return res.status(403).json(
            { msg: "Tu cuenta ha sido suspendida por mal comportamiento" }
        )
    }

    if(!jugadorBDD) return res.status(404).json(
        {msg:"Usuario no registrado"}
    )
    const verificarPassword = await jugadorBDD.matchPassword(password)

    if(!verificarPassword)res.status(401).json(
        {msg:"Contraseña incorrecta"}
    )
    const {nombre,apellido,username,_id,rol} = jugadorBDD
    const token = crearTokenJWT(jugadorBDD._id,jugadorBDD.rol)

    res.status(200).json({
        token,
        nombre,
        apellido,
        username,
        _id,
        email:jugadorBDD.email
    })

}

const perfil =(req,res)=>{
    const {token,confirmEmail,createdAt,updatedAt,__v,...datosPerfil} = req.jugadorBDD
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

    const jugadorBDD = await Jugadores.findById(id)
    if(!jugadorBDD) return res.status(404).json(
        {msg:`Lo sentimos, no existe el jugador ${id}`}
    )
    if (jugadorBDD.email != email)
    {
        const jugadorBDDMail = await Jugadores.findOne({email})
        if (jugadorBDDMail)
        {
            return res.status(404).json(
                {msg:`Lo sentimos, el email existe ya se encuentra registrado`}
            )  
        }
    }
    jugadorBDD.nombre = nombre ?? jugadorBDD.nombre
    jugadorBDD.apellido = apellido ?? jugadorBDD.apellido
    jugadorBDD.username = username ?? jugadorBDD.username
    jugadorBDD.email = email ?? jugadorBDD.email

    if (req.files?.imagen) {
        if (jugadorBDD.avatarJugadorID) {
            await cloudinary.uploader.destroy(jugadorBDD.avatarJugadorID);
        }

        const { secure_url, public_id } = await cloudinary.uploader.upload(
            req.files.imagen.tempFilePath,
            { folder: 'Jugadores' }
        );

        jugadorBDD.avatarJugador = secure_url;
        jugadorBDD.avatarJugadorID = public_id;

        await fs.unlink(req.files.imagen.tempFilePath);
    }

    await jugadorBDD.save()
    res.status(200).json(jugadorBDD)
}

const actualizarPassword = async (req,res)=>{
    const jugadorBDD = await Jugadores.findById(req.jugadorBDD._id)
    if(!jugadorBDD) return res.status(404).json(
        {msg:`Lo sentimos, no existe el jugador ${id}`}
    )
    const{presentpassword,newpassword} = req.body
    if (Object.values(req.body).includes("")) {
        return res.status(400).json(
            { msg: "Lo sentimos, debes llenar todos los campos" }
        );
    }
    const verificarPassword = await jugadorBDD.matchPassword(presentpassword)
    if(!verificarPassword) return res.status(404).json(
        {msg:"Lo sentimos, La contraseña actual no es correcta"}
    )
    jugadorBDD.password = await jugadorBDD.encrypPassword(newpassword)
    await jugadorBDD.save()
    res.status(200).json(
        {msg:"Contraseña actualizada correctamente"}
    )
}

const actualizarImagenPerfil = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "ID inválido" });
    }

    const jugador = await Jugadores.findById(id);
    if (!jugador) {
        return res.status(404).json({ msg: "Jugador no encontrado" });
    }

    try {
        // Si ya tiene imagen previa en Cloudinary, eliminarla
        if (jugador.avatarJugadorID) {
            await cloudinary.uploader.destroy(jugador.avatarJugadorID);
        }

        let secure_url, public_id;

        // Caso 1: Imagen subida como archivo
        if (req.files?.imagen) {
            const { tempFilePath } = req.files.imagen;
            ({ secure_url, public_id } = await cloudinary.uploader.upload(tempFilePath, {
                folder: "Jugadores",
            }));
            await fs.unlink(tempFilePath);
            jugador.avatarJugador = secure_url;
            jugador.avatarJugadorID = public_id;
        }

        // Caso 2: Imagen enviada como Base64 desde IA
        else if (req.body?.avatarJugadorIA) {
            const base64Data = req.body.avatarJugadorIA.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            ({ secure_url, public_id } = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "Jugadores", resource_type: "auto" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(buffer);
            }));

            jugador.avatarJugadorIA = secure_url;
            jugador.avatarJugadorID = public_id;
        } else {
            return res.status(400).json({ msg: "No se envió ninguna imagen" });
        }

        await jugador.save();

        res.status(200).json({
            msg: "Imagen actualizada correctamente",
            avatar: secure_url
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al subir imagen" });
    }
}


const listarJugadores = async (req,res)=>{
    const jugadores = await Jugadores.find({status:true}).select(" -createdAt -updatedAt -__v -password")
    res.status(200).json(jugadores)
}

const detalleJugador = async(req,res)=>{
    const {id} = req.params
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json(
        {msg:`Lo sentimos, no existe el jugador ${id}`}
    )
    const jugadores = await Jugadores.findById(id).select("-createdAt -updatedAt -__v -password")
    res.status(200).json(jugadores)
}


const eliminarCuentaJugador = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json(
            { msg: `ID inválido` }
        )
    }

    if (req.jugadorBDD?._id.toString() !== id) {
        return res.status(403).json(
            { msg: "No tienes permisos para eliminar esta cuenta" }
        )
    }

    if (req.jugadorBDD.avatarJugadorID) {
        await cloudinary.uploader.destroy(req.jugadorBDD.avatarJugadorID);
    }

    await Jugadores.findByIdAndDelete(id);
    res.status(200).json(
        { msg: "Tu cuenta ha sido eliminada correctamente" }
    )
}

const donarJugador = async (req, res) => {
    const { paymentMethodId, cantidad, motivo } = req.body;

    if (!paymentMethodId || !cantidad || cantidad <= 1) {
        return res.status(400).json(
            { msg: "Datos incompletos o inválidos" }
        )
    }

    try {
        const jugador = req.jugadorBDD;
        if (!jugador) return res.status(401).json(
            { msg: "No autorizado" }
        )

        let [cliente] = (
        await stripe.customers.list({ email: jugador.email, limit: 1 })
        ).data || []

        if (!cliente) {
        cliente = await stripe.customers.create({
            name: `${jugador.nombre} ${jugador.apellido}`,
            email: jugador.email,
        });
        }

        const pago = await stripe.paymentIntents.create({
            amount: cantidad, 
            currency: "usd",
            description: motivo || "Donación al sistema",
            payment_method: paymentMethodId,
            confirm: true,
            customer: cliente.id,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
            }
        })

        if (pago.status === "succeeded") {
            return res.status(200).json(
                { msg: "¡Gracias por tu donación!" }
            )
        } else {
            return res.status(400).json(
                { msg: "No se pudo procesar el pago" }
            )
        }
    } catch (error) {
        console.error("Error de Stripe:", error.message)
        return res.status(500).json(
            { msg: "Error al procesar la donación" }
        )
    }
}

export {
    registro,
    confirmarEmail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevaPassword,
    login,
    perfil,
    actualizarPerfil,
    actualizarPassword,
    actualizarImagenPerfil,
    listarJugadores,
    detalleJugador,
    eliminarCuentaJugador,
    donarJugador
}