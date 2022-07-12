const jwt = require('jsonwebtoken');
const redisClient = require('../middlewares/authorization').redisClient;


// VERIFY LOGIN CREDENTIALS AND RETURN USER...
const validateCredentials = async (database, bcrypt, req, res) => {
  const { username, password } = req.body;
  //set return variables
  let user, login;
  // sanitize form data;
  if (!username || !password) {
    return Promise.reject("Incorrect Form Submission") // keep all responses in main handler funcion
  }

  try {
    login = await database.select('username', 'hash').from('login').where('username', '=', username);
    user = await database.select('*').from('users').where('username', '=', username);
  } 
  catch (error) {
    return Promise.reject('Error retrieving user');
  }

  const isValid = await bcrypt.compare(password, login[0].hash);

  console.log(isValid);

  return isValid ? user[0] : Promise.reject('Invalid credentials');
};

const getAuthTokenID = (req, res) => {
  const { authorization } = req.headers;
  return new Promise((resolve, reject) => {
    redisClient.get(authorization, (err, reply) => {
      if (err || !reply) {
        reject(err)
      }
      resolve({userid: reply})
    })
  });
};

const signToken = (username) => {
  // set info inside jwt as the username and return token...
  const jwtPayload = { username }
  console.log(process.env.JWT_SECRET);
  return jwt.sign(jwtPayload, process.env.JWT_SECRET)
};

const setToken = (key, value) => {
  return new Promise((resolve, reject) => {
    resolve(redisClient.set(key, value));
    reject('Session Error');
  })
};

const createSessions = (user) => {
  const { username, userid } = user;
  // sign token using the username (data contained in token)...
  const token = signToken(username);
  console.log(token);

  return setToken(token, userid).then(() => {
    console.log(token);
    console.log(userid);
    return {
      success: true,
      userid,
      token
    }
  }).catch(err => console.log(err))
}

// main handler, all responses go through this function
const handleSignIn = (database, bcrypt) => (req, res) => {
  const { authorization } = req.headers;
  
  console.log(authorization);

  return authorization ? 
    getAuthTokenID(req, res)
    .then(data => res.json(data))
    .catch(err => res.status(400).json(err))
    :
    validateCredentials(database, bcrypt, req, res)
    .then(user => {
      console.log(user);
      return user.userid && user.username ? createSessions(user) : Promise.reject(user)
    })
    .then(session => res.json(session))
    .catch(err => res.status(400).json(err))
};

module.exports = {
  handleSignIn,
};