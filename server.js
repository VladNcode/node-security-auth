require('dotenv').config({ path: './config.env' });
const express = require('express');
const helmet = require('helmet');
const cookieSession = require('cookie-session');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');

const fs = require('fs');
const path = require('path');
const https = require('https');

const config = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,
  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const AUTH_OPTIONS = {
  callbackURL: '/auth/google/callback',
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
};

const verifyCallback = function (accessToken, refreshToken, profile, done) {
  // console.log('Google profile: ', profile);
  // console.log('Profile email:', profile.emails[0].value);
  // console.log('Profile id: ', profile.id);
  done(null, profile);
};

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

// Save the session to the cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Read the session from the cookie
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const app = express();
app.use(helmet());
app.use(
  cookieSession({
    name: 'session',
    maxAge: 1000 * 60 * 60 * 24,
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
  })
);

app.use(passport.initialize());
app.use(passport.session());

const port = 3000;

console.log(config);

const checkLoggedIn = (req, res, next) => {
  console.log('Current user: ', req.user);
  console.log(req.isAuthenticated());

  const isLoggedIn = req.isAuthenticated() && req.user;

  if (!isLoggedIn) {
    return res.status(401).json({
      error: 'Not logged in!',
    });
  }

  next();
};

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['email'],
  })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/failure',
    successRedirect: '/',
    session: true,
  }),
  (req, res) => {
    console.log('Google called us back!');
  }
);

app.get('/auth/logout', (req, res) => {
  req.session = null;
  req.logout(); // Removes req.user and clears any logged in session
  res.clearCookie('session');
  // res.redirect('/');

  res.status(200).json({
    status: 'success',
    message: 'You have successfully logged out',
  });
});

app.get('/secret', checkLoggedIn, (req, res) => {
  res.send('42');
});

app.get('/failure', (req, res) => {
  res.send('Failed to login!');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

https
  .createServer(
    {
      cert: fs.readFileSync('cert.pem'),
      key: fs.readFileSync('key.pem'),
    },
    app
  )
  .listen(port, (req, res) => {
    console.log(`Server is running on port ${port}`);
  });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
