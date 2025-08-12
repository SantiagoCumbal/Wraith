import {Schema, model} from 'mongoose'
import bcrypt from "bcryptjs"


const administradorSchema = new Schema({
    nombre:{
        type:String,
        required:true,
        trim:true
    },
    apellido:{
        type:String,
        required:true,
        trim:true
    },
    username:{
        type:String,
        trim:true,
        required:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    avatarAdministrador:{
        type:String,
        trim:true
    },
    avatarAdministradorID:{
        type:String,
        trim:true
    },
    avatarAdministradorIA:{
        type:String,
        trim:true
    },

    rol:{
        type:String,
        default:"Administrador"
    },
    status:{
        type:Boolean,
        default:true
    },
    token:{
        type:String,
        default:null
    }

},{
    timestamps:true
})


// Método para cifrar el password del administrador
administradorSchema.methods.encrypPassword = async function(password){
    const salt = await bcrypt.genSalt(10)
    const passwordEncryp = await bcrypt.hash(password,salt)
    return passwordEncryp
}

// Método para verificar si el password ingresado es el mismo de la BDD
administradorSchema.methods.matchPassword = async function(password){
    const response = await bcrypt.compare(password,this.password)
    return response
}

// Método para crear un token 
administradorSchema.methods.crearToken = function(){
    const tokenGenerado = this.token = Math.random().toString(36).slice(2)
    return tokenGenerado
}


export default model('Administrador',administradorSchema)