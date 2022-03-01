const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');

const app = express();

const port = 3000;

app.get('/secret', (req, res) => {
  res.send('42');
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
