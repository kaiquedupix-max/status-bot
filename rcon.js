const WebSocket = require("ws");


const {
    savePlayer
} = require("./database");



let identifier = 0;




function debug(...args){

    if(process.env.DEBUG_RCON === "true"){

        console.log(...args);

    }

}





function rconCommand(command){


return new Promise((resolve,reject)=>{


debug(
"📡 RCON:",
command
);



const ws = new WebSocket(

`ws://${process.env.RCON_HOST}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`

);



const timeout = setTimeout(()=>{


ws.close();


reject(
new Error("RCON timeout")
);


},15000);







ws.on("open",()=>{


identifier++;



ws.send(JSON.stringify({

Identifier:identifier,

Message:command,

Name:"GuerraFriaAdmin"

}));



});








ws.on("message",(data)=>{


clearTimeout(timeout);



try{


const response = JSON.parse(

data.toString()

);



resolve(

response.Message

);



}catch{


resolve(

data.toString()

);



}



ws.close();



});








ws.on("error",(error)=>{


clearTimeout(timeout);



console.log(

"❌ RCON:",
error.message

);



reject(error);



});



});



}









// =======================
// PLAYERS ONLINE
// =======================


async function getPlayers(){


try{


const response = await rconCommand(

"playerlist"

);



const players = JSON.parse(response);





// salva jogadores no banco

players.forEach(player=>{


savePlayer(player);



});





return players;



}catch(error){


console.log(

"Erro playerlist:",

error.message

);



return [];

}


}









// =======================
// INFO SERVIDOR
// =======================


async function getServerInfo(){


try{


const response = await rconCommand(

"serverinfo"

);



return JSON.parse(response);



}catch(error){


console.log(

"Erro serverinfo:",

error.message

);



return {

Players:0,

MaxPlayers:125,

Uptime:0,

Hostname:""

};


}


}









// =======================
// BAN ONLINE/OFFLINE
// =======================


async function banPlayer(

steamid,

name,

reason

){



const motivo =

reason?.trim()

||

"Sem motivo informado";





const finalReason =

`${motivo} | Apelação: discord.gg/s3J5NCYURD`;





return await rconCommand(

`banid "${steamid}" "${name}" "${finalReason}"`

);



}









// =======================
// BAN TEMPORÁRIO
// =======================


async function tempBanPlayer(

steamid,

name,

reason,

duration

){



const motivo =

reason?.trim()

||

"Sem motivo informado";





const finalReason =

`${motivo} | Apelação: discord.gg/s3J5NCYURD`;





return await rconCommand(

`banid "${steamid}" "${name}" "${finalReason}" ${duration}`

);



}









// =======================
// KICK
// =======================


async function kickPlayer(

steamid,

reason

){



const motivo =

reason?.trim()

||

"Sem motivo informado";





return await rconCommand(

`kick "${steamid}" "${motivo}"`

);



}









// =======================
// UNBAN
// =======================


async function unbanPlayer(

steamid

){



return await rconCommand(

`unban "${steamid}"`

);



}








module.exports = {


rconCommand,

getPlayers,

getServerInfo,

banPlayer,

tempBanPlayer,

kickPlayer,

unbanPlayer


};