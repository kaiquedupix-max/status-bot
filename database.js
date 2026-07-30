const Database = require("better-sqlite3");


const db = new Database("database.sqlite");




// ==========================
// TABELA DE JOGADORES
// ==========================

db.prepare(`

CREATE TABLE IF NOT EXISTS players (

    steamid TEXT PRIMARY KEY,

    name TEXT,

    last_seen INTEGER,

    joins INTEGER DEFAULT 1

)

`).run();





// ==========================
// TABELA DE PUNIÇÕES
// ==========================

db.prepare(`

CREATE TABLE IF NOT EXISTS punishments (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    steamid TEXT,

    name TEXT,

    type TEXT,

    reason TEXT,

    admin TEXT,

    created INTEGER

)

`).run();








// Salvar ou atualizar jogador

function savePlayer(player){


const antigo = db.prepare(`

SELECT * FROM players WHERE steamid = ?

`).get(

player.SteamID

);



if(antigo){



db.prepare(`

UPDATE players

SET

name = ?,

last_seen = ?,

joins = joins + 1

WHERE steamid = ?

`).run(

player.DisplayName,

Date.now(),

player.SteamID

);



}else{



db.prepare(`

INSERT INTO players

(

steamid,

name,

last_seen,

joins

)

VALUES (?,?,?,?)

`).run(

player.SteamID,

player.DisplayName,

Date.now(),

1

);



}



}









// Buscar por nome

function searchPlayers(name){


return db.prepare(`

SELECT *

FROM players

WHERE name LIKE ?

ORDER BY last_seen DESC

LIMIT 25

`).all(

`%${name}%`

);



}








// Buscar SteamID

function getPlayer(steamid){


return db.prepare(`

SELECT *

FROM players

WHERE steamid = ?

`).get(

steamid

);



}








// Salvar punição

function savePunishment(data){



db.prepare(`

INSERT INTO punishments

(

steamid,

name,

type,

reason,

admin,

created

)

VALUES (?,?,?,?,?,?)

`).run(

data.steamid,

data.name,

data.type,

data.reason,

data.admin,

Date.now()

);



}








// Histórico

function getHistory(steamid){


return db.prepare(`

SELECT *

FROM punishments

WHERE steamid = ?

ORDER BY created DESC

`).all(

steamid

);



}








module.exports = {


savePlayer,

searchPlayers,

getPlayer,

savePunishment,

getHistory


};