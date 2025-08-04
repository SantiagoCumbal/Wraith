import { Router } from 'express';
import passport from "passport";
import { crearTokenJWT } from '../middlewares/JWT.js';

const router = Router();

// GOOGLE
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const jugador = req.user;
    const token = crearTokenJWT(jugador._id, jugador.rol);
    res.status(200).json({
      token,
      nombre: jugador.nombre,
      apellido: jugador.apellido,
      username: jugador.username,
      _id: jugador._id,
      email: jugador.email
    });

  }
);

// FACEBOOK
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => res.redirect('/dashboard')
);

// Cerrar sesión
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
});

export default router;
