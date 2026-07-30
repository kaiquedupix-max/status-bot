const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");


const {

    getPlayers,
    banPlayer,
    kickPlayer,
    unbanPlayer

} = require("./rcon");



const {

    searchPlayers,
    getPlayer,
    savePunishment,
    getHistory

} = require("./database");





let client;



function setClient(bot){

    client = bot;

}





function isAdmin(interaction){


return interaction.member.roles.cache.has(

process.env.ADMIN_ROLE_ID

);


}








const commands = [



new SlashCommandBuilder()

.setName("players")

.setDescription(
"Lista jogadores online"
),




new SlashCommandBuilder()

.setName("buscar-player")

.setDescription(
"Busca jogador online ou offline"
)

.addStringOption(option=>

option

.setName("nome")

.setDescription("Nome do jogador")

.setRequired(true)

),




new SlashCommandBuilder()

.setName("historico")

.setDescription(
"Mostra histórico do jogador"
)

.addStringOption(option=>

option

.setName("steamid")

.setDescription("SteamID")

.setRequired(true)

),





new SlashCommandBuilder()

.setName("desbanir")

.setDescription(
"Remove ban"
)

.addStringOption(option=>

option

.setName("steamid")

.setDescription("SteamID")

.setRequired(true)

)

];










async function execute(interaction){



if(interaction.commandName==="players"){



const players = await getPlayers();



if(!players.length){


return interaction.reply({

content:"🟡 Nenhum jogador online.",

ephemeral:true

});


}




const embed = new EmbedBuilder()


.setTitle(
"🎮 Jogadores Online"
)


.setDescription(

players.map(p=>`

👤 **${p.DisplayName}**

🆔 ${p.SteamID}

📶 ${p.Ping}ms

`).join("\n")

)


.setColor("Green")

.setFooter({

text:
`${players.length} jogadores online`

});





return interaction.reply({

embeds:[embed]

});



}









if(interaction.commandName==="buscar-player"){



if(!isAdmin(interaction))

return interaction.reply({

content:"❌ Sem permissão.",

ephemeral:true

});



const nome =

interaction.options.getString("nome");





const online = await getPlayers();



let resultado = online.filter(p=>

p.DisplayName

.toLowerCase()

.includes(

nome.toLowerCase()

)

);





if(!resultado.length){



resultado = searchPlayers(nome);



}






if(!resultado.length){


return interaction.reply({

content:
"❌ Jogador não encontrado.",

ephemeral:true

});


}







const menu = new StringSelectMenuBuilder()


.setCustomId(

"player_action"

)

.setPlaceholder(

"Escolha o jogador"

)


.addOptions(

resultado.slice(0,25).map(p=>({


label:

(p.DisplayName || p.name)

.substring(0,100),


description:

p.SteamID,


value:

p.SteamID



}))

);






return interaction.reply({

content:

"🔎 Jogadores encontrados:",


components:[

new ActionRowBuilder()

.addComponents(menu)

],


ephemeral:true

});



}


async function handleSelect(interaction){



if(interaction.customId==="player_action"){



const steamid = interaction.values[0];


const player = getPlayer(steamid);




const buttons = new ActionRowBuilder()

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

`history_${steamid}`

)

.setLabel(

"📜 Histórico"

)

.setStyle(

ButtonStyle.Secondary

)



);






return interaction.update({

content:

`

👤 **${player?.name || "Jogador"}**

🆔 ${steamid}


Escolha uma ação:

`,


components:[buttons]

});



}



}









async function handleButton(interaction){



const id = interaction.customId;





// =====================
// HISTÓRICO
// =====================


if(id.startsWith("history_")){



const steamid = id.replace(

"history_",

""

);



const history = getHistory(

steamid

);




if(!history.length){


return interaction.reply({

content:

"📄 Nenhuma punição encontrada.",

ephemeral:true

});


}





const embed = new EmbedBuilder()

.setTitle(

"📜 Histórico de Punições"

)


.setDescription(

history.map(h=>`

🚨 **${h.type}**

📌 ${h.reason}

👮 ${h.admin}

📅 <t:${Math.floor(h.created/1000)}:R>

`).join("\n")

)


.setColor("Red");




return interaction.reply({

embeds:[embed],

ephemeral:true

});



}







// =====================
// BAN
// =====================


if(id.startsWith("ban_")){



const steamid = id.replace(

"ban_",

""

);




const modal = new ModalBuilder()

.setCustomId(

`ban_modal_${steamid}`

)


.setTitle(

"🔨 Aplicar Ban"

);





const motivo = new TextInputBuilder()

.setCustomId(

"motivo"

)

.setLabel(

"Motivo do ban"

)

.setStyle(

TextInputStyle.Paragraph

)

.setRequired(true)

.setPlaceholder(

"Exemplo: Cheat, racismo, divulgação..."

);





modal.addComponents(

new ActionRowBuilder()

.addComponents(motivo)

);





return interaction.showModal(

modal

);



}



}









async function handleModal(interaction){



if(!interaction.customId.startsWith(

"ban_modal_"

)){


return;

}



await interaction.deferReply();





const steamid = interaction.customId.replace(

"ban_modal_",

""

);





const motivo = interaction.fields.getTextInputValue(

"motivo"

);






const player = getPlayer(

steamid

);





const nome =

player?.name ||

"Desconhecido";








const resposta = await banPlayer(

steamid,

nome,

motivo

);








savePunishment({

steamid,

name:nome,

type:"BAN",

reason:motivo,

admin:interaction.user.tag

});







const embed = new EmbedBuilder()

.setTitle(

"🔨 BAN APLICADO"

)

.setDescription(`

👤 **Jogador**

${nome}


🆔 **SteamID**

${steamid}


📌 **Motivo**

${motivo}


👮 **Administrador**

${interaction.user}


📡 **Servidor**

${resposta}


🔗 **Apelação**

discord.gg/s3J5NCYURD

`)

.setColor("Red");





return interaction.editReply({

embeds:[embed]

});



}




if(interaction.commandName==="historico"){



if(!isAdmin(interaction))

return interaction.reply({

content:"❌ Sem permissão.",

ephemeral:true

});




const steamid =

interaction.options.getString(

"steamid"

);





const player = getPlayer(

steamid

);



const history = getHistory(

steamid

);






const embed = new EmbedBuilder()

.setTitle(

"📜 Histórico do Jogador"

)

.setDescription(`

👤 **Nome**

${player?.name || "Desconhecido"}


🆔 **SteamID**

${steamid}


📊 **Entradas no servidor**

${player?.joins || 0}


🕒 **Última vez visto**

${player?.last_seen ? `<t:${Math.floor(player.last_seen/1000)}:R>` : "Nunca"}


━━━━━━━━━━━━━━


${history.length ?

history.map(h=>`

🚨 **${h.type}**

📌 ${h.reason}

👮 ${h.admin}

📅 <t:${Math.floor(h.created/1000)}:R>

`).join("\n")

:

"Sem punições registradas."

}

`)

.setColor("Blue");






return interaction.reply({

embeds:[embed]

});



}








// =====================
// DESBANIR
// =====================



if(interaction.commandName==="desbanir"){



if(!isAdmin(interaction))

return interaction.reply({

content:"❌ Sem permissão.",

ephemeral:true

});





const steamid =

interaction.options.getString(

"steamid"

);





const resposta = await unbanPlayer(

steamid

);






const embed = new EmbedBuilder()

.setTitle(

"✅ BAN REMOVIDO"

)

.setDescription(`

🆔 **SteamID**

${steamid}


📡 **Resposta Rust**

${resposta}


👮 **Administrador**

${interaction.user}

`)

.setColor("Green");





return interaction.reply({

embeds:[embed]

});



}






}














module.exports = {


commands,

execute,

handleSelect,

handleButton,

handleModal,

setClient


};



