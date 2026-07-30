require("dotenv").config();



const {

    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle

} = require("discord.js");



const {

    execute,
    handleSelect,
    handleModal,
    handleButton,
    setClient

} = require("./commands");



const {

    getServerInfo,
    getPlayers

} = require("./rcon");






const client = new Client({

    intents:[

        GatewayIntentBits.Guilds

    ]

});







let statusMessage;

let adminPanelMessage;









// ===============================
// STATUS SERVIDOR
// ===============================


async function updateStatus(){


try{


const channel = await client.channels.fetch(

process.env.CHANNEL_ID

);





const rust = await getServerInfo();



const players =

rust.Players ?? 0;



const maxPlayers =

rust.MaxPlayers ?? 125;







const embed = new EmbedBuilder()


.setTitle(

"🟢 GUERRA FRIA 2X"

)


.setDescription(`

━━━━━━━━━━━━━━


🎮 **Servidor Online**


👥 **Jogadores**

${players}/${maxPlayers} jogadores online


🗺️ **Mapa**

${rust.Map}


⚡ **FPS**

${Math.round(rust.Framerate)}


🌐 **IP**

${process.env.GAME_IP}


🔄 Atualizado:

<t:${Math.floor(Date.now()/1000)}:R>


━━━━━━━━━━━━━━

`)


.setColor(

"Green"

);





client.user.setActivity(

`🎮 Guerra Fria 2X | 👥 ${players}/${maxPlayers} online`

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



}catch(error){


console.log(

"Erro status:",

error.message

);


}



}









// ===============================
// PAINEL ADMIN
// ===============================


async function updateAdminPanel(){


try{


const channel = await client.channels.fetch(

process.env.ADMIN_CHANNEL_ID

);





const players = await getPlayers();





const embed = new EmbedBuilder()


.setTitle(

"🛡️ CENTRAL ADMINISTRATIVA"

)


.setDescription(

players.length

?

players.map(p=>`

👤 **${p.DisplayName}**

🆔 ${p.SteamID}

📶 Ping: ${p.Ping}ms

❤️ Vida: ${Math.round(p.Health)}

`).join("\n")

:

"🟡 Nenhum jogador online"

)


.setColor(

"Blue"

)


.setFooter({

text:

`Online: ${players.length}`

});





const buttons=[];





players.slice(0,25).forEach(player=>{


buttons.push(

new ActionRowBuilder()

.addComponents(

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

)

)

);


});





if(adminPanelMessage){


await adminPanelMessage.edit({

embeds:[embed],

components:buttons

});


}else{


adminPanelMessage = await channel.send({

embeds:[embed],

components:buttons

});


}



}catch(error){


console.log(

"Erro painel:",

error.message

);


}



}









client.once(

"clientReady",

()=>{


console.log(

`🤖 Online: ${client.user.tag}`

);




setClient(client);



updateStatus();

updateAdminPanel();



setInterval(

updateStatus,

60000

);



setInterval(

updateAdminPanel,

30000

);



});









// ===============================
// INTERAÇÕES
// ===============================


client.on(

"interactionCreate",

async interaction=>{


try{



if(interaction.isChatInputCommand()){


return execute(interaction);


}






if(interaction.isStringSelectMenu()){


return handleSelect(interaction);


}





if(interaction.isModalSubmit()){


return handleModal(interaction);


}





if(interaction.isButton()){



if(

interaction.customId.startsWith(

"actions_"

)

){



const steamid =

interaction.customId.replace(

"actions_",

""

);





const row = new ActionRowBuilder()

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

)


);





return interaction.reply({

content:

`⚙️ Ações do jogador\n🆔 ${steamid}`,

components:[row],

ephemeral:true

});


}



return handleButton(interaction);


}



}catch(error){


console.log(

"Erro interação:",

error

);



if(!interaction.replied){


interaction.reply({

content:"❌ Erro interno.",

ephemeral:true

});


}



}



});







client.login(

process.env.DISCORD_TOKEN

);