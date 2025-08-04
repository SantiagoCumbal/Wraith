import { Router } from 'express';
import passport from "passport";

const router = Router();

// GOOGLE
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('/dashboard')
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
