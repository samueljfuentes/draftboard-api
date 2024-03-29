const getPlayers = async (database, fetch, req) => {
  const username = req.body.userid ? req.body.username : 'guest';
  let myPlayers = await database.select('*').from('myplayers').where('username', '=', username)
    // .then(data => data)
    .catch('!*!*!*!*!');
  myPlayers = myPlayers.length ? myPlayers[0].playerlist : [];
  try {
    // check if any relations exist in all players table ie: previous user...
    const exists = await database.schema.hasTable('allPlayers'); 
    
    if (!exists) {
      let players;
      // contact 3rd party API for players...
      const proxyURL = "https://salty-caverns-26864.herokuapp.com/";
      const testURL = "https://api.fantasynerds.com/v1/nfl/players?apikey=TEST&include_inactive="
      let response = await fetch(testURL, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          // 'origin': proxyURL
        }
      });
      players = await response.json();
      players = players.filter(player => player.position === "QB" || player.position === "RB" || player.position === "WR" || player.position === "TE");
      
      
      // start a database transaction and to create and return all players...
      return await database.transaction(async trx => {
        // create all players table and return all players...
        return trx.schema.createTable('allPlayers', (table) => {
          table.integer('playerId').primary().notNullable();
          table.string('displayName', 100).notNullable();
          table.string('position', 5).notNullable();
          table.string('team', 10);
        }).then(async () => {
          console.log('created table and inserting then returning all new Players...')
          // insert all players in database and return all players as a promise...
          let allPlayers = await trx.insert(
            // before inserting, must modify each player object to fit into database...
            players.map(player => {
              return {
                playerId: player.playerId,
                displayName: player.name,
                position: player.position,
                team: player.team
              }  
            })
          ).into('allPlayers').returning('*');
          
          return {
            allPlayers:[...allPlayers],
            myPlayers: [...myPlayers]
          }
        })
      })
    }
    // prior relations exist in players table, ie: previous user, return all players...
    else {
      console.log('table existed and returning all players');
      const allPlayers = await database.select('*').from('allPlayers');
      return {
        myPlayers: [...myPlayers],
        allPlayers: [...allPlayers]
      }
    }
  }
  catch (error) {
    console.log(error);
    trx.rollback();
  }
};

const addPlayer = async (database, req) => {
  const { username, player } = req.body;
  // check for existing my players table for this user...
  let userTable = await database.select('*').from('myplayers').where('username', '=', username);
  // create appropriate player object with rank & tier...
  let newPlayer = {
    ...player,
    tier: 10,
    rank: userTable.length ? 
      // userTable[0].playerlist.length + 1 : 1
      // the new players rank should be one more than the lowest ranked player of = position, ie: length + 1
      userTable[0].playerlist.filter(myPlayer => myPlayer.position === player.position).length + 1 :
      1
  };
  

  try {
    // if previous my player table exists...
    if (userTable.length) {
      let newPlayerList = userTable[0].playerlist;
      newPlayerList.push(newPlayer);
      return await database.transaction(async trx => {
        return await trx('myplayers').where('username', '=', username).update({
          playerlist: JSON.stringify(newPlayerList)
        }, ['playerlist']); // array indicates which columns to return...
      })
    }
    else {
      return await database.transaction(async trx => {
        await trx.insert({
          username: username,
          playerlist: JSON.stringify([newPlayer])
        }).into('myplayers')
        return await trx.select('playerlist').from('myplayers').where('username', '=', username)
      })
    }
  }
  catch (error) {
    trx.rollback(error)
  }
};

const removePlayer = async (database, req) => {
  const { username, player } = req.body;
  let userInfo = await database.select('*').from('myplayers').where('username', '=', username);
  const userMyPlayers = userInfo[0].playerlist;
  const newMyPlayers = userMyPlayers.filter(myPlayer => myPlayer.playerId !== player.playerId && myPlayer.displayName !== player.displayName).map(newMyPlayer => {
    if (newMyPlayer.position === player.position && newMyPlayer.rank > player.rank) {
      return {
        ...newMyPlayer,
        rank: newMyPlayer.rank - 1
      }
    }
    else {
      return {
        ...newMyPlayer
      }
    }
  });
  
  try {
    return await database.transaction(async trx => {
      return await trx('myplayers').where('username', '=', username).update({
        playerlist: JSON.stringify(newMyPlayers)
      }, ['playerlist'])
    });
  }
  catch {
    trx.rollback(error);
  }
};

const updateMyPlayers = async (database, req) => {
  const {username, myPlayerList} = req.body;
  try {
    return await database.transaction(async trx => {
      return await trx('myplayers').where('username', '=', username).update({
        playerlist: JSON.stringify(myPlayerList)
      }, ['playerlist'])
    });
  }
  catch (error) {
    trx.rollback();
  }
};

const testDB = async (database) => {
  console.log('HITTING DB...')
  return await database.select('*').from('users');
}

// MAIN HANDLERS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const handleGetPlayers = (database, fetch) => (req, res) => {
  getPlayers(database, fetch, req)
  .then(players => res.json(players))
  .catch(err => res.status(400).json(err))
};

const handleAddMyPlayer = (database) => (req, res) => {
  addPlayer(database, req) // will access return value with array[0].playerlist
  .then(data => res.json(data[0].playerlist))
  .catch(err => res.status(400).json(err))
};

const handleRemoveMyPlayer = (database) => (req, res) => {
  removePlayer(database, req)
  .then(data => res.json(data[0].playerlist))
  .catch(err => res.status(400).json(err))
};

const handleUpdateMyPlayers = (database) => (req, res) => {
  updateMyPlayers(database, req)
  .then(data => {
    console.log('DB WAS HIT, returned something');
    res.json(data)
  })
  .catch(err => res.status(400).json(err))
}

module.exports = {
  handleGetPlayers: handleGetPlayers,
  handleAddMyPlayer: handleAddMyPlayer,
  handleRemoveMyPlayer: handleRemoveMyPlayer,
  handleUpdateMyPlayers: handleUpdateMyPlayers
};