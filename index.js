require("dotenv").config();

const fs = require("fs");

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






const STATUS_FILE = "./status.json";









function readStatus(){


try{

return JSON.parse(

fs.readFileSync(STATUS_FILE)

);


}catch{

return {};

}


}








function saveStatus(data){


fs.writeFileSync(

STATUS_FILE,

JSON.stringify(data,null,2)

);


}









function formatUptime(seconds){



if(!seconds)

return "0 minutos";



const h = Math.floor(seconds / 3600);

const m = Math.floor(

(seconds % 3600) / 60

);



return `${h}h ${m}min`;



}









async function updateStatus(){


try{



const channel = await client.channels.fetch(

process.env.STATUS_CHANNEL_ID

);




const server = await getServerInfo();


const players = await getPlayers();




const online = players.length;


const max = server.MaxPlayers || 125;






const embed = new EmbedBuilder()


.setTitle(

"🟢 GUERRA FRIA 2X"

)



.setDescription(`

🎮 **Servidor Online**


👥 **Jogadores**

\`${online}/${max}\` online


⏱️ **Uptime**

${formatUptime(server.Uptime)}


🌐 **Conectar**

\`client.connect ${process.env.GAME_IP}\`


📡 **IP**

${process.env.GAME_IP}


🔄 Atualizado:

<t:${Math.floor(Date.now()/1000)}:R>

`)



.setColor(

"Green"

);








const button = new ButtonBuilder()

.setLabel(

"🎮 Conectar no servidor"

)

.setStyle(

ButtonStyle.Link

)

.setURL(

`steam://connect/${process.env.GAME_IP}`

);





const row = new ActionRowBuilder()

.addComponents(button);







const old = readStatus();





if(old.messageId){



try{



const message = await channel.messages.fetch(

old.messageId

);



await message.edit({

embeds:[embed],

components:[row]

});



return;



}catch(error){



console.log(

"Mensagem antiga não encontrada."

);



}



}






const message = await channel.send({

embeds:[embed],

components:[row]

});





saveStatus({

messageId:message.id

});






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









client.once(

"clientReady",

()=>{


console.log(

`🤖 Bot conectado: ${client.user.tag}`

);



setClient(client);



updateStatus();




setInterval(

updateStatus,

60000

);



});










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

return handleButton(interaction);

}




}catch(error){



console.log(

"❌ Erro interação:",

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