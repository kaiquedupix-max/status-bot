const {

    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle

} = require("discord.js");



const Database = require("better-sqlite3");



const {

    getPlayers,
    banPlayer,
    kickPlayer,
    unbanPlayer

} = require("./rcon");







const db = new Database(

"database.sqlite"

);







function isAdmin(interaction){


return interaction.member.roles.cache.has(

process.env.ADMIN_ROLE_ID

);


}









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










async function sendBanLog(data){


try{


const channel =

await interactionClient.channels.fetch(

process.env.BAN_LOG_CHANNEL_ID

);





const embed =

new EmbedBuilder()

.setTitle(

"🚨 NOVA PUNIÇÃO"

)

.setDescription(`

🔨 **${data.type}**


👤 **Jogador:**

${data.name}


🆔 **SteamID:**

${data.steamid}


📝 **Motivo:**

${data.reason}


👮 **Administrador:**

${data.admin}


📅 <t:${Math.floor(Date.now()/1000)}:F>


🌐 ${process.env.SERVER_NAME}

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



}catch(e){


console.log(

"Erro log:",
e.message

);


}


}








let interactionClient;





function setClient(client){

interactionClient = client;

}









const commands = [


new SlashCommandBuilder()

.setName("listar-player")

.setDescription("Lista jogadores online"),





new SlashCommandBuilder()

.setName("buscar-player")

.setDescription("Busca jogador")

.addStringOption(option=>

option

.setName("steamid")

.setDescription("SteamID")

.setRequired(true)

),






new SlashCommandBuilder()

.setName("banir")

.setDescription("Banir jogador online"),





new SlashCommandBuilder()

.setName("kickar")

.setDescription("Kickar jogador online"),





new SlashCommandBuilder()

.setName("desbanir")

.setDescription("Remove ban")

.addStringOption(option=>

option

.setName("steamid")

.setDescription("SteamID")

.setRequired(true)

)


];


async function execute(interaction){


if(interaction.commandName==="listar-player"){


const players =

await getPlayers();



const embed =

new EmbedBuilder()

.setTitle("📋 PLAYERS ONLINE")

.setDescription(

players.length

?

players.map((p,i)=>

`${i+1}. **${p.DisplayName}**\n🆔 ${p.SteamID}`

).join("\n\n")

:

"❌ Nenhum jogador online."

)

.setColor("Green");



return interaction.reply({

embeds:[embed]

});

}



if(interaction.commandName==="banir"){


if(!isAdmin(interaction))

return interaction.reply({

content:"❌ Sem permissão.",

ephemeral:true

});



return abrirSelecao(interaction,"ban");


}




if(interaction.commandName==="kickar"){


if(!isAdmin(interaction))

return interaction.reply({

content:"❌ Sem permissão.",

ephemeral:true

});



return abrirSelecao(interaction,"kick");


}





if(interaction.commandName==="desbanir"){


const id =

interaction.options.getString("steamid");



const resposta =

await unbanPlayer(id);



return interaction.reply({

content:

`✅ Ban removido\n${resposta}`

});


}





if(interaction.commandName==="buscar-player"){


const id =

interaction.options.getString("steamid");



const players =

await getPlayers();



const p =

players.find(

x=>x.SteamID===id

);



return interaction.reply({

content:

p

?

`👤 ${p.DisplayName}\n🆔 ${p.SteamID}`

:

"❌ Não encontrado."

});


}


}










async function abrirSelecao(interaction,tipo){


const players =

await getPlayers();



const menu =

new StringSelectMenuBuilder()

.setCustomId(

`${tipo}_player`

)

.setPlaceholder(

"Selecione o jogador"

)

.addOptions(

players.slice(0,25)

.map(p=>({

label:p.DisplayName.substring(0,100),

description:p.SteamID,

value:`${tipo}_${p.SteamID}`

}))

);





return interaction.reply({

content:

"Selecione o jogador:",

components:[

new ActionRowBuilder()

.addComponents(menu)

]

});



}









async function handleSelect(interaction){



const [tipo,steamid] =

interaction.values[0].split("_");





const modal =

new ModalBuilder()

.setCustomId(

`${tipo}_${steamid}`

)

.setTitle(

tipo==="ban"

?

"Motivo do Ban"

:

"Motivo do Kick"

);





const input =

new TextInputBuilder()

.setCustomId("motivo")

.setLabel("Motivo")

.setStyle(

TextInputStyle.Paragraph

)

.setRequired(true);





modal.addComponents(

new ActionRowBuilder()

.addComponents(input)

);



await interaction.showModal(modal);


}









async function handleButton(interaction){



const [action,steamid] =

interaction.customId.split("_");





if(

action!=="ban" &&

action!=="kick"

)

return;





const modal =

new ModalBuilder()

.setCustomId(

`${action}_${steamid}`

)

.setTitle(

action==="ban"

?

"Motivo do Ban"

:

"Motivo do Kick"

);





const input =

new TextInputBuilder()

.setCustomId("motivo")

.setLabel("Motivo")

.setStyle(

TextInputStyle.Paragraph

)

.setRequired(true);





modal.addComponents(

new ActionRowBuilder()

.addComponents(input)

);



await interaction.showModal(modal);


}









async function handleModal(interaction){



const [tipo,steamid] =

interaction.customId.split("_");



const motivo =

interaction.fields.getTextInputValue(

"motivo"

);





const players =

await getPlayers();



const player =

players.find(

p=>p.SteamID===steamid

);



const nome =

player?.DisplayName || steamid;





let resposta;



if(tipo==="ban"){


resposta =

await banPlayer(

steamid,

motivo

);


}



if(tipo==="kick"){


resposta =

await kickPlayer(

steamid,

motivo

);


}





savePunishment({

steamid,

name:nome,

type:tipo.toUpperCase(),

reason:motivo,

admin:interaction.user.tag

});






if(interactionClient){


await sendBanLog({

steamid,

name:nome,

type:tipo.toUpperCase(),

reason:motivo,

admin:interaction.user.tag

});


}






return interaction.reply({

embeds:[

new EmbedBuilder()

.setTitle(

tipo==="ban"

?

"🔨 BAN APLICADO"

:

"👢 KICK APLICADO"

)

.setDescription(`

👤 ${nome}

🆔 ${steamid}

📝 ${motivo}

👮 ${interaction.user}

📡 ${resposta}

`)

.setColor(

tipo==="ban"

?

"Red"

:

"Orange"

)

]

});


}








module.exports = {


commands,

execute,

handleSelect,

handleModal,

handleButton,

setClient

};