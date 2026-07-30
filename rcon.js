const WebSocket = require("ws");


let identifier = 0;



function rconCommand(command){


return new Promise((resolve,reject)=>{


console.log("📡 RCON ENVIANDO:", command);



const ws = new WebSocket(

`ws://${process.env.RCON_HOST}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`

);



const timeout = setTimeout(()=>{


ws.close();


reject(
new Error("RCON Timeout")
);


},15000);





ws.on("open",()=>{


console.log("✅ RCON CONECTADO");



identifier++;



ws.send(JSON.stringify({


Identifier: identifier,


Message: command,


Name:"GuerraFriaAdminBot"


}));



});








ws.on("message",(data)=>{


clearTimeout(timeout);



try{


const json = JSON.parse(

data.toString()

);



console.log(
"📥 RCON RESPOSTA:",
json
);



resolve(json.Message);



}catch(error){



resolve(
data.toString()
);



}



ws.close();



});







ws.on("error",(err)=>{


clearTimeout(timeout);



console.log(
"❌ Erro RCON:",
err.message
);



reject(err);



});





ws.on("close",()=>{


console.log(
"🔌 RCON DESCONECTADO"
);


});



});



}









// =============================
// PLAYERS ONLINE
// =============================


async function getPlayers(){


try{


const response = await rconCommand(

"playerlist"

);



return JSON.parse(response);



}catch(error){


console.log(

"❌ Erro playerlist:",

error.message

);



return [];


}



}









// =============================
// INFORMAÇÕES SERVIDOR
// =============================


async function getServerInfo(){


try{


const response = await rconCommand(

"serverinfo"

);



return JSON.parse(response);



}catch(error){


console.log(

"❌ Erro serverinfo:",

error.message

);



return {

Players:0,

MaxPlayers:125,

Map:"Desconhecido",

Framerate:0

};


}



}









// =============================
// BAN
// =============================


async function banPlayer(id,reason){


const motivo =

reason && reason.trim()

?

reason.trim()

:

"Sem motivo informado";





return await rconCommand(

`ban ${id} "${motivo}"`

);



}









// =============================
// KICK
// =============================


async function kickPlayer(id,reason){


const motivo =

reason && reason.trim()

?

reason.trim()

:

"Sem motivo informado";





return await rconCommand(

`kick ${id} "${motivo}"`

);



}









// =============================
// UNBAN
// =============================


async function unbanPlayer(id){


return await rconCommand(

`unban ${id}`

);



}







module.exports = {


rconCommand,

getPlayers,

getServerInfo,

banPlayer,

kickPlayer,

unbanPlayer


};