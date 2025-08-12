import mongoose, { Schema } from 'mongoose';

const mensajeSchema = new Schema({
  remitenteId: { 
    type: String,
  },
  destinatarioId: { 
    type: String,
  },
  mensaje: { 
    type: String,
  },
  fecha: { 
    type: Date, 
    default: Date.now
  }
});

const Mensaje = mongoose.models.Mensaje || mongoose.model('Mensaje', mensajeSchema);

export default Mensaje;


