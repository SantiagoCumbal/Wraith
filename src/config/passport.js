import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import Jugadores from "../models/Jugador.js"
import dotenv from 'dotenv'
import bcrypt from "bcryptjs"
dotenv.config()


// SERIALIZE / DESERIALIZE
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Jugadores.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// GOOGLE STRATEGY
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://wraith-24zv.onrender.com/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await Jugadores.findOne({ avatarJugadorID: profile.id });
    if (user) return done(null, user);

     // Encriptar la palabra "google"
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash("google", salt);

    user = await Jugadores.create({
      username: profile.displayName,
      email: profile.emails?.[0]?.value || 'sinemail@google.com',
      nombre: profile.name?.givenName || '',
      apellido: profile.name?.familyName || '',
      password: passwordEncriptada, 
      avatarJugador: profile.photos && profile.photos[0].value,
      avatarJugadorID: profile.id,
      confirmarEmail: true
    });

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// FACEBOOK STRATEGY
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: 'https://wraith-24zv.onrender.com/api/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'email', 'name', 'photos'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await Jugadores.findOne({ avatarJugadorID: profile.id });
    if (user) return done(null, user);

    // Encriptar la palabra "google"
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash("facebook", salt);

    user = await Jugadores.create({
      username: profile.displayName,
      email: profile.emails?.[0]?.value || 'sinemail@facebook.com',
      nombre: profile.name?.givenName || '',
      apellido: profile.name?.familyName || '',
      password: passwordEncriptada,
      avatarJugadorID: profile.id,
      avatarJugador: profile.photos && profile.photos[0].value,
      confirmarEmail: true
    });

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));


