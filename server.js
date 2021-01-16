const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
const fetch = require('node-fetch');

const auth = require('./middlewares/authorization');

const signIn = require('./controllers/signin');
const signUp = require('./controllers/signup');
const profile = require('./controllers/profile');
const draftboard = require('./controllers/draftboard');



const database = knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI
});


const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => { res.send('SERVER IS UP!!!') });
app.post('/signin', signIn.handleSignIn(database, bcrypt));
app.post('/signup', signUp.handleSignUp(database, bcrypt));
app.get('/profile/:userid', auth.requireAuth, profile.handleProfileGet(database));
// app.get('/findProfile', auth.requireAuth, profile.findProfile(database))
app.post('/draftboard', draftboard.handleGetPlayers(database, fetch));
app.post('/addplayer', draftboard.handleAddMyPlayer(database));

app.listen(3000, () => {
  console.log('APP IS RUNNING ON PORT 3000!')
});