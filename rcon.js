const WebSocket = require("ws");


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



debug(
"RCON RESPONSE:",
response.Message
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

"❌ RCON erro:",

error.message

);



reject(error);



});



});



}









// ===========================
// PLAYERS
// ===========================


async function getPlayers(){


try{


const result = await rconCommand(

"playerlist"

);



return JSON.parse(result);



}catch(error){


console.log(

"Erro playerlist:",

error.message

);



return [];

}


}









// ===========================
// SERVER INFO
// ===========================


async function getServerInfo(){


try{


const result = await rconCommand(

"serverinfo"

);



return JSON.parse(result);



}catch(error){


console.log(

"Erro serverinfo:",

error.message

);



return {

Players:0,

MaxPlayers:125,

Map:"",

Framerate:0

};


}



}









// ===========================
// BAN
// ===========================


async function banPlayer(

steamid,

name,

reason

){


const motivo =

reason?.trim()

||

"Sem motivo informado";





return await rconCommand(

`banid "${steamid}" "${name}" "${motivo}"`

);



}









// ===========================
// BAN TEMPORARIO
// ===========================


async function tempBanPlayer(

steamid,

name,

reason,

tempo

){


const motivo =

reason?.trim()

||

"Sem motivo informado";





return await rconCommand(

`banid "${steamid}" "${name}" "${motivo}" ${tempo}`

);



}









// ===========================
// KICK
// ===========================


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









// ===========================
// UNBAN
// ===========================


async function unbanPlayer(

steamid

){


return await rconCommand(

`unban "${steamid}"`

);



}








module.exports={


rconCommand,

getPlayers,

getServerInfo,

banPlayer,

tempBanPlayer,

kickPlayer,

unbanPlayer


};