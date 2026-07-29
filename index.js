require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");


const {
    execute,
    handleSelect,
    handleModal
} = require("./commands");


const {
    getServerInfo
} = require("./rcon");



const client = new Client({

    intents:[
        GatewayIntentBits.Guilds
    ]

});



let statusMessage;



// =====================================
// ATUALIZAR STATUS
// =====================================

async function updateStatus(){


try{


const channel = await client.channels.fetch(
    process.env.CHANNEL_ID
);



const rust = await getServerInfo();



const players =
rust.Players ?? 0;



const max =
rust.MaxPlayers ?? 125;



const embed = new EmbedBuilder()


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

`Guerra Fria 2x | ${players}/${max} jogadores`

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



});







// =====================================
// INTERAÇÕES
// =====================================


client.on(

"interactionCreate",

async interaction=>{


try{


// Slash Commands

if(interaction.isChatInputCommand()){


await execute(interaction);


}




// Menu jogador

if(interaction.isStringSelectMenu()){


await handleSelect(interaction);


}




// Modal motivo

if(interaction.isModalSubmit()){


await handleModal(interaction);


}



}catch(error){



console.log(
"❌ Erro interação:",
error
);



if(!interaction.replied){

interaction.reply({

content:
"❌ Ocorreu um erro.",

ephemeral:true

});

}


}



});






client.login(

process.env.DISCORD_TOKEN

);