BEGIN TRANSACTION;

CREATE TABLE allPlayers (
  playerId INTEGER PRIMARY KEY NOT NULL,
  displayName VARCHAR(100) NOT NULL,
  position VARCHAR(5) NOT NULL,
  jersey SMALLINT NOT NULL,
  lastName VARCHAR(50),
  firstName VARCHAR(50)
);

COMMIT;