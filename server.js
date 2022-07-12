const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(args)).catch(err => console.log(err));

const signIn = require('./controllers/signin');
const signUp = require('./controllers/signup');
const profile = require('./controllers/profile');
const draftboard = require('./controllers/draftboard');

const auth = require('./middlewares/authorization');


//INIT SERVER
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// INIT POSTGRES DB
const connectionVar = process.env.DATABASE_URL ? process.env.DATABASE_URL : process.env.POSTGRES_URL;
const database = knex({
  client: 'pg',
  connection: {
    connectionString: connectionVar,
    ssl: {
      require: false,
      rejectUnauthorized: false
    }
  }
});


// ROUTES
app.get('/', (req, res) => { res.send('SERVER IS UP!!!') });
app.post('/signin', signIn.handleSignIn(database, bcrypt));
app.post('/signup', signUp.handleSignUp(database, bcrypt));
app.get('/profile/:userid', auth.requireAuth, profile.handleProfileGet(database));
// app.get('/findProfile', auth.requireAuth, profile.findProfile(database))
app.post('/draftboard', draftboard.handleGetPlayers(database, fetch));
app.post('/addplayer', draftboard.handleAddMyPlayer(database));
app.post('/removeplayer', draftboard.handleRemoveMyPlayer(database));
app.post('/updatemyplayers', draftboard.handleUpdateMyPlayers(database));


app.listen(process.env.PORT || 3000, () => {
  console.log(`APP IS RUNNING ON PORT ${process.env.PORT || 3000}`);
});