const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");


const {
    getPlayers,
    banPlayer,
    kickPlayer,
    unbanPlayer
} = require("./rcon");



let discordClient;



function setClient(client){

    discordClient = client;

}





function isAdmin(interaction){

    return interaction.member.roles.cache.has(
        process.env.ADMIN_ROLE_ID
    );

}





async function sendBanLog(data){


try{


const channel = await discordClient.channels.fetch(

process.env.BAN_LOG_CHANNEL_ID

);



const embed = new EmbedBuilder()

.setTitle(
"🚨 PUNIÇÃO APLICADA"
)


.setDescription(`

━━━━━━━━━━━━━━

👤 **Jogador**

${data.name}


🆔 **SteamID**

${data.steamid}


🔨 **Ação**

${data.action}


📌 **Motivo**

${data.reason}


👮 **Administrador**

${data.admin}


🔗 **Apelação**

https://discord.gg/s3J5NCYURD


🕒 <t:${Math.floor(Date.now()/1000)}:F>

━━━━━━━━━━━━━━

`)


.setColor(

data.action==="BAN"

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
"Erro log:",
error.message
);

}


}









const commands = [

new SlashCommandBuilder()

.setName("listar-player")

.setDescription(
"Lista jogadores online"
),



new SlashCommandBuilder()

.setName("banir")

.setDescription(
"Banir jogador online"
),



new SlashCommandBuilder()

.setName("kickar")

.setDescription(
"Kickar jogador online"
),



new SlashCommandBuilder()

.setName("desbanir")

.setDescription(
"Remove ban pelo SteamID"
)

.addStringOption(option=>

option

.setName("steamid")

.setDescription("SteamID")

.setRequired(true)

)

];









async function execute(interaction){


if(interaction.commandName==="listar-player"){


const players = await getPlayers();



if(!players.length){

return interaction.reply({

content:
"🟡 Nenhum jogador online",

ephemeral:true

});

}



const embed = new EmbedBuilder()

.setTitle(
"📋 Jogadores Online"
)

.setDescription(

players.map(p=>

`

👤 **${p.DisplayName}**

🆔 ${p.SteamID}

📶 ${p.Ping}ms

`

).join("\n")

)

.setColor("Green");



return interaction.reply({

embeds:[embed]

});



}






if(

interaction.commandName==="banir"

){



if(!isAdmin(interaction))

return interaction.reply({

content:"❌ Sem permissão",

ephemeral:true

});



return abrirMenu(

interaction,

"ban"

);



}






if(

interaction.commandName==="kickar"

){



if(!isAdmin(interaction))

return interaction.reply({

content:"❌ Sem permissão",

ephemeral:true

});



return abrirMenu(

interaction,

"kick"

);



}





if(

interaction.commandName==="desbanir"

){



const id =

interaction.options.getString(

"steamid"

);



await unbanPlayer(id);



return interaction.reply({

content:

`✅ Ban removido\n🆔 ${id}`

});

}


}


async function abrirMenu(interaction,tipo){


const players = await getPlayers();



if(!players.length){

return interaction.reply({

content:"🟡 Nenhum jogador online.",

ephemeral:true

});

}





const menu = new StringSelectMenuBuilder()

.setCustomId(

`${tipo}_player`

)

.setPlaceholder(

"Selecione o jogador"

)

.addOptions(

players.slice(0,25).map(player=>({


label:

player.DisplayName.substring(0,100),


description:

player.SteamID,


value:

player.SteamID



}))

);





const row = new ActionRowBuilder()

.addComponents(menu);





return interaction.reply({

content:

tipo==="ban"

?

"🔨 Escolha o jogador para banir:"

:

"👢 Escolha o jogador para kickar:",


components:[row],


ephemeral:true

});



}









async function handleSelect(interaction){



const steamid = interaction.values[0];


const tipo = interaction.customId.replace(

"_player",

""

);





const modal = new ModalBuilder()

.setCustomId(

`${tipo}_${steamid}`

)

.setTitle(

tipo==="ban"

?

"🔨 Motivo do Ban"

:

"👢 Motivo do Kick"

);







const motivo = new TextInputBuilder()

.setCustomId(

"motivo"

)

.setLabel(

"Digite o motivo"

)

.setStyle(

TextInputStyle.Paragraph

)

.setPlaceholder(

"Exemplo: Cheat, racismo, ofensa..."

)

.setRequired(true);





modal.addComponents(

new ActionRowBuilder()

.addComponents(motivo)

);





await interaction.showModal(modal);



}









async function handleModal(interaction){



const dados = interaction.customId.split("_");



const tipo = dados[0];

const steamid = dados[1];




const motivo =

interaction.fields.getTextInputValue(

"motivo"

);






const players = await getPlayers();



const player = players.find(

p=>p.SteamID===steamid

);




const nome =

player?.DisplayName || "Desconhecido";







let resposta;





if(tipo==="ban"){



resposta = await banPlayer(

steamid,

nome,

motivo

);



}






if(tipo==="kick"){



resposta = await kickPlayer(

steamid,

motivo

);



}








await sendBanLog({

name:nome,

steamid,

action:

tipo==="ban"

?

"BAN"

:

"KICK",

reason:motivo,

admin:interaction.user.tag

});








const embed = new EmbedBuilder()

.setTitle(

tipo==="ban"

?

"🔨 BAN APLICADO"

:

"👢 KICK APLICADO"

)


.setDescription(`

━━━━━━━━━━━━━━


👤 **Jogador**

${nome}


🆔 **SteamID**

${steamid}


📌 **Motivo**

${motivo}


👮 **Administrador**

${interaction.user}


🔗 **Apelação**

https://discord.gg/s3J5NCYURD


━━━━━━━━━━━━━━


📡 **Resposta Rust**

${resposta}


`)


.setColor(

tipo==="ban"

?

"Red"

:

"Orange"

);





return interaction.reply({

embeds:[embed]

});



}










async function handleButton(interaction){


return;



}








module.exports={


commands,

execute,

handleSelect,

handleModal,

handleButton,

setClient


};
