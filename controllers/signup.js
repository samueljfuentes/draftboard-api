const jwt = require('jsonwebtoken');
const redisClient = require('../middlewares/authorization').redisClient;

const registerUser = (database, bcrypt, req, res) => {
  const { username, password, passwordConfirm } = req.body;
  // sanitize sign up form data...
  if (!username || !password || (password !== passwordConfirm)) {
    return Promise.reject('Incorrect registration.')
  };
  // hash the password...
  const hash = bcrypt.hashSync(password, 0);

  try {
    return database.transaction(async trx => {
      // store username and hash into login table, return username...
      let currentUsername = await trx.insert({
        username,
        hash
      }).into('login').returning('username'); 
      // store username and sign up date into users table, return user...
      let user = await trx('users').returning('*').insert({
        username: currentUsername[0],
        joined: new Date()
      });
      // must return promise or call trx.commit...
      return Promise.resolve(user[0])
    });
  }
  catch (error) {
    // rollback returns a rejected promise as well as reverting database...
    trx.rollback(error)
  }
};

const signToken = (username) => {
  const payload = {username};
  return jwt.sign(payload, process.env.JWT_SECRET);
};

const setToken = (key, value) => {
  return new Promise((resolve, reject) => {
    resolve(redisClient.set(key, value));
    reject('Session Error');
  })
};

const createSession = (user) => {
  const {userid, username} = user;
  const token = signToken(username);
  return setToken(token, userid).then(() => {
    return {
      success: true,
      user,
      token
    }
  }).catch(err => console.log(err));
};

// MAIN HANDLER; ALL RESPONSES HERE
const handleSignUp = (database, bcrypt) => (req, res) => {
  registerUser(database, bcrypt, req, res)
    .then(user => createSession(user))
    .then(session => res.json(session))
    .catch(err => res.status(400).json(`Signup Failed: ${err}`))
};

module.exports = {
  handleSignUp: handleSignUp
}