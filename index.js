require("dotenv").config();


const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
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
// DATABASE
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

let adminPanelMessage;









// =============================
// SALVAR JOGADORES
// =============================


async function savePlayers(){


try{


const players =
await getPlayers();



for(const player of players){


const old =

db.prepare(

"SELECT * FROM players WHERE steamid=?"

)

.get(player.SteamID);






if(old){


db.prepare(`

UPDATE players SET

name=?,

last_seen=?,

times_seen=times_seen+1

WHERE steamid=?

`)

.run(

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

VALUES

(?,?,?,?)

`)

.run(

player.SteamID,

player.DisplayName,

Date.now(),

Date.now()

);


}



}



}catch(error){


console.log(

"Erro banco players:",

error.message

);


}


}









// =============================
// PAINEL ADMIN
// =============================


async function updateAdminPanel(){


try{


const channel =

await client.channels.fetch(

process.env.ADMIN_CHANNEL_ID

);



const players =

await getPlayers();





let description = "";





const rows = [];





if(!players.length){


description =

"🟡 Nenhum jogador online.";


}else{



for(const player of players.slice(0,25)){


description +=

`
👤 **${player.DisplayName}**

🆔 ${player.SteamID}

❤️ ${Math.round(player.Health)}

📶 ${player.Ping}ms

`;



const button =

new ButtonBuilder()

.setCustomId(

`actions_${player.SteamID}`

)

.setLabel(

`⚙️ ${player.DisplayName}`

.substring(0,80)

)

.setStyle(

ButtonStyle.Secondary

);



rows.push(

new ActionRowBuilder()

.addComponents(button)

);



}



}



const embed =

new EmbedBuilder()

.setTitle(

"🛡️ PAINEL ADMINISTRAÇÃO"

)

.setDescription(description)

.setColor("Blue")

.setFooter({

text:

`Players online: ${players.length}`

});

// continua updateAdminPanel


if(adminPanelMessage){


await adminPanelMessage.edit({

embeds:[embed],

components:rows

});


}else{


adminPanelMessage =

await channel.send({

embeds:[embed],

components:rows

});


}



console.log(

"✅ Painel ADM atualizado"

);



}catch(error){


console.log(

"❌ Erro painel ADM:",

error.message

);


}


}









// =============================
// LOG DE BANIMENTOS
// =============================


async function sendBanLog(data){


try{


const channel =

await client.channels.fetch(

process.env.BAN_LOG_CHANNEL_ID

);





const embed =

new EmbedBuilder()

.setTitle(

"🚨 NOVA PUNIÇÃO"

)

.setDescription(`

🔨 **Tipo:** ${data.type}


👤 **Jogador:**

${data.name}


🆔 **SteamID:**

${data.steamid}


📝 **Motivo:**

${data.reason}


👮 **Administrador:**

${data.admin}


📅 **Data:**

<t:${Math.floor(Date.now()/1000)}:F>


🌐 **Servidor:**

${process.env.SERVER_NAME}

`)

.setColor(

data.type==="BAN"

?

"Red"

:

"Orange"

);





await channel.send({

embeds:[embed]

});



}catch(error){


console.log(

"Erro log punição:",

error.message

);


}



}









// =============================
// REGISTRAR PUNIÇÃO BANCO
// =============================


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

`)

.run(

data.steamid,

data.name,

data.type,

data.reason,

data.admin,

Date.now()

);


}










// =============================
// STATUS SERVIDOR
// =============================


async function updateStatus(){


try{


const channel =

await client.channels.fetch(

process.env.CHANNEL_ID

);



const rust =

await getServerInfo();





const embed =

new EmbedBuilder()

.setTitle(

"🟢 SERVIDOR ONLINE"

)

.setDescription(`

🎮 **${process.env.SERVER_NAME}**


👥 **Players:** ${rust.Players}/${rust.MaxPlayers}


🗺️ **Mapa:** ${rust.Map}


⚡ **FPS:** ${Math.round(rust.Framerate)}


🌎 **IP:** ${process.env.GAME_IP}


🔄 Atualizado: <t:${Math.floor(Date.now()/1000)}:R>

`)

.setColor("Green");





client.user.setActivity(

`Guerra Fria 2X | ${rust.Players}/${rust.MaxPlayers}`

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



}catch(error){


console.log(

"Erro status:",

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

updateAdminPanel();

savePlayers();





setInterval(

updateStatus,

60000

);



setInterval(

updateAdminPanel,

30000

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



// BOTÃO AÇÕES DO PLAYER

if(interaction.isButton()){



const id =

interaction.customId;





if(id.startsWith("actions_")){



const steamid =

id.replace(

"actions_",

""

);





const row =

new ActionRowBuilder()

.addComponents(


new ButtonBuilder()

.setCustomId(

`ban_${steamid}`

)

.setLabel(

"🔨 Banir"

)

.setStyle(

ButtonStyle.Danger

),



new ButtonBuilder()

.setCustomId(

`kick_${steamid}`

)

.setLabel(

"👢 Kickar"

)

.setStyle(

ButtonStyle.Primary

),



new ButtonBuilder()

.setCustomId(

`info_${steamid}`

)

.setLabel(

"🔎 Info"

)

.setStyle(

ButtonStyle.Secondary

)



);






return interaction.reply({

content:

`⚙️ Ações para SteamID:\n${steamid}`,

components:[row],

ephemeral:true

});



}






// INFO PLAYER


if(id.startsWith("info_")){


const steamid =

id.replace(

"info_",

""

);



const players =

await getPlayers();



const player =

players.find(

p=>p.SteamID===steamid

);



return interaction.reply({

embeds:[


new EmbedBuilder()

.setTitle(

"🔎 Informações do jogador"

)

.setDescription(`

👤 ${player?.DisplayName || "Desconhecido"}

🆔 ${steamid}

❤️ Vida: ${player?.Health || 0}

📶 Ping: ${player?.Ping || 0}

`)

.setColor("Blue")


],

ephemeral:true

});


}






// BAN PELO BOTÃO


if(id.startsWith("ban_")){


const steamid =

id.replace(

"ban_",

""

);



const modal =

require("discord.js").ModalBuilder;





return interaction.reply({

content:

`Use o comando /banir para aplicar o motivo ao jogador ${steamid}`,

ephemeral:true

});



}






// KICK PELO BOTÃO


if(id.startsWith("kick_")){


const steamid =

id.replace(

"kick_",

""

);



return interaction.reply({

content:

`Use o comando /kickar para aplicar o motivo ao jogador ${steamid}`,

ephemeral:true

});


}



}







// SLASH COMMANDS


if(interaction.isChatInputCommand()){


await execute(interaction);


}






// SELECT MENU


if(interaction.isStringSelectMenu()){


await handleSelect(interaction);


}





// MODAL


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
