require("dotenv").config();

const fs = require("fs");

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
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




const STATUS_FILE = "./status-message.json";

const ADMIN_FILE = "./admin-panel.json";





function salvarArquivo(path,data){

    fs.writeFileSync(
        path,
        JSON.stringify(data,null,2)
    );

}





function lerArquivo(path){

    try{

        return JSON.parse(
            fs.readFileSync(path)
        );

    }catch{

        return null;

    }

}









async function atualizarStatus(){


try{


const channel = await client.channels.fetch(

process.env.CHANNEL_ID

);



const rust = await getServerInfo();


const players = await getPlayers();


const online = players.length;


const max = rust.MaxPlayers || 125;





const embed = new EmbedBuilder()

.setTitle(

"🟢 GUERRA FRIA 2X"

)


.setDescription(`

━━━━━━━━━━━━━━

🎮 **Servidor Online**


👥 **Jogadores**

**${online}/${max} jogadores online**


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


.setColor("Green");





client.user.setActivity(

`🎮 Guerra Fria 2X | 👥 ${online}/${max} online`

);





let data = lerArquivo(

STATUS_FILE

);



if(data?.messageId){



try{


const msg = await channel.messages.fetch(

data.messageId

);



await msg.edit({

embeds:[embed]

});


return;



}catch{



console.log(
"Mensagem antiga não encontrada, criando nova."
);


}



}






const nova = await channel.send({

embeds:[embed]

});





salvarArquivo(

STATUS_FILE,

{

messageId:nova.id

}

);





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









async function atualizarPainelAdmin(){


try{


const channel = await client.channels.fetch(

process.env.ADMIN_CHANNEL_ID

);



const players = await getPlayers();





const embed = new EmbedBuilder()

.setTitle(

"🛡️ Painel Administrativo"

)

.setDescription(

players.length

?

players.map(p=>

`

👤 **${p.DisplayName}**

🆔 ${p.SteamID}

📶 Ping: ${p.Ping}ms

❤️ Vida: ${Math.round(p.Health)}

`

).join("\n")

:

"🟡 Nenhum jogador online"

)


.setColor("Blue")


.setFooter({

text:`Players online: ${players.length}`

});






let data = lerArquivo(

ADMIN_FILE

);



if(data?.messageId){



try{


const msg = await channel.messages.fetch(

data.messageId

);



await msg.edit({

embeds:[embed]

});



return;



}catch{}



}






const nova = await channel.send({

embeds:[embed]

});





salvarArquivo(

ADMIN_FILE,

{

messageId:nova.id

}

);





}catch(error){


console.log(

"❌ Erro painel admin:",

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



atualizarStatus();


atualizarPainelAdmin();





setInterval(

atualizarStatus,

60000

);



setInterval(

atualizarPainelAdmin,

30000

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

"Erro interação:",

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