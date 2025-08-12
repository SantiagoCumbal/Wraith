import { Router } from 'express';
import passport from "passport";
import jwt from "jsonwebtoken";
import { crearTokenJWT } from '../middlewares/JWT.js';
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// GOOGLE
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    try {
      if (!req.user) {
        console.error('No se recibió usuario de Passport en Google callback');
        return res.redirect(`${process.env.URL_FRONTEND}auth/callback?error=No se pudo autenticar con Google`);
      }

      const jugador = req.user;

      if (jugador.status === false) {
        return res.redirect(`${process.env.URL_FRONTEND}auth/callback?error=Cuenta suspendida`);
      }

      const token = jwt.sign(
        { id: jugador._id, rol: jugador.rol },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const redirectUrl =
        `${process.env.URL_FRONTEND}auth/callback?` +
        `token=${token}&` +
        `nombre=${encodeURIComponent(jugador.nombre)}&` +
        `email=${encodeURIComponent(jugador.email)}&` +
        `rol=${jugador.rol}`;

      return res.redirect(redirectUrl);

    } catch (err) {
      console.error('Error en Google callback:', err);
      return res.redirect(`${process.env.URL_FRONTEND}auth/callback?error=Error interno del servidor`);
    }
  }
);


// FACEBOOK
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const jugador = req.user;

    if (jugador.status === false) {
      return res.redirect(`${process.env.URL_FRONTEND}/auth/callback?error=Cuenta suspendida`);
    }

    const token = jwt.sign(
      { id: jugador._id, rol: jugador.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const redirectUrl =
      `${process.env.URL_FRONTEND}/auth/callback?` +
      `token=${token}&` +
      `nombre=${encodeURIComponent(jugador.nombre)}&` +
      `email=${encodeURIComponent(jugador.email)}&` +
      `rol=${jugador.rol}`;

    res.redirect(redirectUrl);
  }
);

// Cerrar sesión
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
});

export default router;
