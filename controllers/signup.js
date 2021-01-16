const registerUser = (database, bcrypt, req, res) => {
  console.log(req.body);
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

  // return Promise.resolve("resolving...");
  
  // database.transaction(trx => {
  //   trx.insert({
  //     username,
  //     hash
  //   })
  //   .into('login').returning('username')
  //   .then(loginusername => {
  //     return trx('users').returning('*').insert({
  //       username: loginusername[0],
  //       joined: new Date()
  //     })
  //     .then(user => res.json(user[0]))
  //     .catch(err => {res.status(400).json(err)})
  //   })
  //   .then(trx.commit)
  //   .catch(trx.rollback)
  // })
  // .catch(err => res.status(400).json('Unable to Register'));
};

// MAIN HANDLER; ALL RESPONSES HERE
const handleSignUp = (database, bcrypt) => (req, res) => {
  registerUser(database, bcrypt, req, res)
    .then(user => res.json(user))
    .catch(err => res.status(400).json(`Signup Failed: ${err}`))
};

module.exports = {
  handleSignUp: handleSignUp
}