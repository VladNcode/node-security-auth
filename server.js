require('dotenv').config({ path: './config.env' });
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');

const fs = require('fs');
const path = require('path');
const https = require('https');

const config = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
};

const AUTH_OPTIONS = {
  callbackURL: '/auth/google/callback',
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
};

const verifyCallback = function (accessToken, refreshToken, profile, done) {
  // console.log('Google profile: ', profile);
  console.log('Profile email:', profile.emails[0].value);
  console.log('Profile id: ', profile.id);

  done(null, profile);
};

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

const app = express();
app.use(helmet());
app.use(passport.initialize());

const port = 3000;

console.log(config);

const checkLoggedIn = (req, res, next) => {
  const isLoggedIn = true;

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
    session: false,
  }),
  (req, res) => {
    console.log('Google called us back!');
  }
);

app.get('/auth/logout', (req, res) => {
  // console.log(req.isAuthenticated());
  // req.session = null;
  // req.logout();
  // res.clearCookie('jwt');
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
