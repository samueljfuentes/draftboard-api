const redisClient = require('./signin').redisClient;

const handleProfileGet = (db) => (req, res) => {
  const { userid } = req.params;
  db.select('*').from('users').where({userid})
  .then(user => {
    if (user.length) {
      res.json(user[0])
    }
    else {
      res.status(400).json('NO USER FOUND')
    }
  })
  .catch(err => res.status(400).json('ERROR GETTING USER'));
};

// const findProfile = (db) => (req, res) => {
//   const { authorization } = req.headers;
//   const userid = redisClient.get(authorization, (err, reply) => {
//     if (err || !reply) {
//       return res.status(400).json('NO ACTIVE SESSION FOUND')
//     }
//     return Promise.resolve({userid: reply})
//   })
//   console.log(userid);
//   db.select('*').from('users').where('userid', '=', userid.userid)
//   .then(user => {
//     if (user.length) {
//       res.json(user[0])
//     }
//     else {
//       res.status(400).json('NO USER FOUND')
//     }
//   })
//   .catch(err => console.log(err));
// }

module.exports = {
  handleProfileGet,
  // findProfile
};