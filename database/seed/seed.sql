BEGIN TRANSACTION;

INSERT INTO users
  (username, joined)
VALUES
  ('test1', '2020-07-20');

INSERT INTO login
  (hash, username)
VALUES
  ('$2b$10$jS3AFCw7lqbei52ITZP.POtxeetK5Fr5u0Xfxy1mjCwj0wwr32iKS', 'test1');
-- password is test1

INSERT INTO myPlayers
  (username, playerList)
VALUES
  ('default', '[]');

COMMIT;