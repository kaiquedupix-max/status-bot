require("dotenv").config();


const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");


const Database = require("better-sqlite3");



const {
    execute,
    handleSelect,
    handleModal
} = require("./commands");



const {
    getServerInfo,
    getPlayers
} = require("./rcon");





// =============================
// BANCO DE DADOS
// =============================


const db = new Database(
    "database.sqlite"
);



db.prepare(`

CREATE TABLE IF NOT EXISTS players (

    steamid TEXT PRIMARY KEY,

    name TEXT,

    first_seen INTEGER,

    last_seen INTEGER,

    times_seen INTEGER DEFAULT 1

)

`).run();




db.prepare(`

CREATE TABLE IF NOT EXISTS punishments (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    steamid TEXT,

    name TEXT,

    type TEXT,

    reason TEXT,

    admin TEXT,

    created INTEGER,

    expires INTEGER

)

`).run();







const client = new Client({

    intents:[

        GatewayIntentBits.Guilds

    ]

});





let statusMessage;

let panelMessage;








// =============================
// SALVAR PLAYERS
// =============================


async function savePlayers(){


try{


const players =
await getPlayers();



for(const player of players){


const exists =
db.prepare(

"SELECT * FROM players WHERE steamid=?"

)
.get(player.SteamID);





if(exists){


db.prepare(`

UPDATE players SET

name=?,

last_seen=?,

times_seen=times_seen+1

WHERE steamid=?

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

first_seen,

last_seen

)

VALUES (?,?,?,?)

`).run(

player.SteamID,

player.DisplayName,

Date.now(),

Date.now()

);



}



}



}catch(error){


console.log(
"❌ Erro salvar players:",
error.message
);


}


}










// =============================
// STATUS DO SERVIDOR
// =============================


async function updateStatus(){


try{


const channel =
await client.channels.fetch(

process.env.CHANNEL_ID

);



const rust =
await getServerInfo();



const players =
rust.Players ?? 0;



const max =
rust.MaxPlayers ?? 125;




const embed =
new EmbedBuilder()


.setTitle(
"🟢 SERVIDOR ONLINE"
)


.setDescription(

`

🎮 **${process.env.SERVER_NAME}**


👥 **Players:** ${players}/${max}


🗺️ **Mapa:** ${rust.Map}


⚡ **FPS:** ${Math.round(rust.Framerate)}


🌎 **IP:** ${process.env.GAME_IP}


🔄 Atualizado: <t:${Math.floor(Date.now()/1000)}:R>

`

)


.setColor("Green");





client.user.setActivity(

`Guerra Fria 2X | ${players}/${max}`

);





if(statusMessage){


await statusMessage.edit({

embeds:[embed]

});


}else{


statusMessage =
await channel.send({

embeds:[embed]

});


}



console.log(
"✅ Status atualizado"
);



}catch(error){


console.log(

"❌ Erro status:",

error.message

);


}



}









// =============================
// BOT ONLINE
// =============================


client.once(

"clientReady",

()=>{


console.log(

`🤖 Bot conectado: ${client.user.tag}`

);



updateStatus();



savePlayers();



setInterval(

updateStatus,

60000

);



setInterval(

savePlayers,

30000

);



});









// =============================
// INTERAÇÕES
// =============================


client.on(

"interactionCreate",

async interaction=>{


try{


if(interaction.isChatInputCommand()){


await execute(interaction);


}



if(interaction.isStringSelectMenu()){


await handleSelect(interaction);


}



if(interaction.isModalSubmit()){


await handleModal(interaction);


}



}catch(error){


console.log(

"❌ Erro interação:",

error

);



if(!interaction.replied){


await interaction.reply({

content:"❌ Erro interno.",

ephemeral:true

});


}


}



});








client.login(

process.env.DISCORD_TOKEN

);