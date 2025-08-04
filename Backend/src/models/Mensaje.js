import mongoose, {Schema,model} from 'mongoose'

const mensajeSchema = new Schema({

    chatId: { 
        type: String, 
        required: true,
    },

    emisorId: 
    { 
        type:mongoose.Schema.Types.ObjectId,
        ref:'Jugadores',
        required: true
    },

    receptorId: { 
        type:mongoose.Schema.Types.ObjectId,
        ref:'Jugadores',
        required: true
    },

    mensaje: { 
        type: String, 
    },

    timestamp: { 
        type: Date, 
        trim:true,
        required: true,
        default: Date.now
    }
})

mensajeSchema.index({ chatId: 1 })

export default model('Mensajes', mensajeSchema)
