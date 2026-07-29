require("dotenv").config();


const {

Client,

GatewayIntentBits,

EmbedBuilder

} = require("discord.js");



const {

execute,

handleSelect

} = require("./commands");



const {

getServerInfo

} = require("./rcon");





const client = new Client({

    intents:[

        GatewayIntentBits.Guilds

    ]

});




let statusMessage = null;




// =====================================
// STATUS DO SERVIDOR
// =====================================


async function updateStatus(){


try{


const channel = await client.channels.fetch(

process.env.CHANNEL_ID

);



const rust = await getServerInfo();



const embed = new EmbedBuilder()


.setTitle(

"🟢 SERVIDOR ONLINE"

)


.setDescription(

`
🎮 **${rust.Hostname}**

👥 **Jogadores**

${rust.Players}/${rust.MaxPlayers}


🗺️ **Mapa**

${rust.Map}


⚡ **FPS**

${rust.Framerate}


🌎 **IP**

${process.env.GAME_IP}


🔄 Atualizado:

<t:${Math.floor(Date.now()/1000)}:R>

`

)


.setColor(

"Green"

);




client.user.setActivity(

`Guerra Fria | ${rust.Players}/${rust.MaxPlayers} jogadores`

);




if(statusMessage){


await statusMessage.edit({

embeds:[embed]

});


}else{


statusMessage = await channel.send({

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






// =====================================
// BANFEED
// =====================================

async function sendBanLog(data){


const channel = await client.channels.fetch(

process.env.BANFEED_CHANNEL_ID

);



const embed = new EmbedBuilder()


.setTitle(

"🔨 NOVO BANIMENTO"

)


.setDescription(

data

)


.setColor(

"Red"

);



channel.send({

embeds:[embed]

});



}






// =====================================
// BOT ONLINE
// =====================================


client.once(

"clientReady",

()=>{


console.log(

`🤖 Bot conectado: ${client.user.tag}`

);



updateStatus();



setInterval(

updateStatus,

60000

);



}

);






// =====================================
// SLASH COMMANDS
// =====================================


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



}catch(error){



console.log(

"Erro comando:",
error

);



}



}

);







client.login(

process.env.DISCORD_TOKEN

);