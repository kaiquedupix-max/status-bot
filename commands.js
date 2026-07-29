const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");


const {
    getPlayers,
    banPlayer,
    kickPlayer,
    unbanPlayer
} = require("./rcon");



// ==============================
// VERIFICAR ADMIN
// ==============================

function isAdmin(interaction){

    return interaction.member.roles.cache.has(
        process.env.ADMIN_ROLE_ID
    );

}



// ==============================
// COMANDOS
// ==============================

const commands = [



// ==============================
// LISTAR PLAYERS
// ==============================

new SlashCommandBuilder()

.setName("listar-player")

.setDescription(
"Lista todos os jogadores online no servidor"
),



// ==============================
// BUSCAR PLAYER
// ==============================

new SlashCommandBuilder()

.setName("buscar-player")

.setDescription(
"Busca informações de um jogador pelo SteamID"
)

.addStringOption(option=>

option

.setName("steamid")

.setDescription(
"SteamID do jogador"
)

.setRequired(true)

),




// ==============================
// BANIR
// ==============================

new SlashCommandBuilder()

.setName("banir")

.setDescription(
"Banir um jogador online"
)

.addStringOption(option=>

option

.setName("motivo")

.setDescription(
"Motivo do ban"
)

.setRequired(true)

),




// ==============================
// KICKAR
// ==============================

new SlashCommandBuilder()

.setName("kickar")

.setDescription(
"Kickar um jogador online"
)

.addStringOption(option=>

option

.setName("motivo")

.setDescription(
"Motivo do kick"
)

.setRequired(true)

),




// ==============================
// DESBANIR
// ==============================

new SlashCommandBuilder()

.setName("desbanir")

.setDescription(
"Remove o ban de um SteamID"
)

.addStringOption(option=>

option

.setName("steamid")

.setDescription(
"SteamID para remover ban"
)

.setRequired(true)

)


];




// ==============================
// EXECUÇÃO
// ==============================

async function execute(interaction){



// ==============================
// LISTAR PLAYER
// ==============================


if(interaction.commandName === "listar-player"){


const players = await getPlayers();



if(!players.length){

return interaction.reply({

content:
"❌ Nenhum jogador online.",

ephemeral:true

});

}



let texto = "";



players.forEach((p,index)=>{


texto +=

`
🟢 **${index+1}. ${p.DisplayName}**

🆔 ${p.SteamID}

`;



});



const embed = new EmbedBuilder()

.setTitle(
"📋 PLAYERS ONLINE - GUERRA FRIA"
)

.setDescription(
texto
)

.setColor(
"Green"
)

.setFooter({

text:
`Total: ${players.length} jogadores`

});



return interaction.reply({

embeds:[
embed
]

});

}





// ==============================
// BUSCAR PLAYER
// ==============================


if(interaction.commandName === "buscar-player"){


const id =
interaction.options.getString("steamid");



const players =
await getPlayers();



const player =
players.find(
p=>p.SteamID === id
);



if(!player){


return interaction.reply({

content:
"❌ Player não encontrado online.",

ephemeral:true

});


}



const embed = new EmbedBuilder()

.setTitle(
"🔎 INFORMAÇÕES DO PLAYER"
)

.setDescription(
`
👤 **Nome**

${player.DisplayName}


🆔 **SteamID**

${player.SteamID}


🔗 **Steam**

https://steamcommunity.com/profiles/${player.SteamID}


❤️ **Vida**

${Math.round(player.Health)}


📶 **Ping**

${player.Ping}ms


👥 **Team ID**

${player.TeamID}


📍 **Posição**

X: ${player.Position.x}

Y: ${player.Position.y}

Z: ${player.Position.z}

`
)

.setColor(
"Blue"
);



return interaction.reply({

embeds:[
embed
]

});

}





// ==============================
// BANIR
// ==============================


if(interaction.commandName === "banir"){



if(!isAdmin(interaction)){

return interaction.reply({

content:
"❌ Você não tem permissão.",

ephemeral:true

});

}



const players =
await getPlayers();



if(!players.length){

return interaction.reply({

content:
"❌ Nenhum player online.",

ephemeral:true

});

}



const motivo =
interaction.options.getString("motivo");



const menu =
new StringSelectMenuBuilder()

.setCustomId(
`banir_select_${motivo}`
)

.setPlaceholder(
"Selecione o jogador"
)

.addOptions(

players.slice(0,25)
.map(player=>({

label:
player.DisplayName.substring(0,100),

description:
player.SteamID,

value:
player.SteamID

}))

);



return interaction.reply({

content:
"🔨 Escolha o jogador para banir:",


components:[

new ActionRowBuilder()

.addComponents(menu)

]

});


}





// ==============================
// KICKAR
// ==============================


if(interaction.commandName === "kickar"){



if(!isAdmin(interaction)){

return interaction.reply({

content:
"❌ Sem permissão.",

ephemeral:true

});

}



const players =
await getPlayers();



const motivo =
interaction.options.getString("motivo");



const menu =
new StringSelectMenuBuilder()

.setCustomId(
`kick_select_${motivo}`
)

.setPlaceholder(
"Selecione o jogador"
)

.addOptions(

players.slice(0,25)
.map(player=>({

label:
player.DisplayName.substring(0,100),

description:
player.SteamID,

value:
player.SteamID

}))

);



return interaction.reply({

content:
"👢 Escolha o jogador para kickar:",


components:[

new ActionRowBuilder()

.addComponents(menu)

]

});


}





// ==============================
// DESBANIR
// ==============================


if(interaction.commandName === "desbanir"){



if(!isAdmin(interaction)){

return interaction.reply({

content:
"❌ Sem permissão.",

ephemeral:true

});

}



const id =
interaction.options.getString("steamid");



await unbanPlayer(id);



return interaction.reply({

content:

`✅ SteamID ${id} removido da lista de banidos.`

});


}



}




// ==============================
// MENU SELECT
// ==============================

async function handleSelect(interaction){



if(!isAdmin(interaction)){

return interaction.reply({

content:
"❌ Sem permissão.",

ephemeral:true

});

}



const [acao, motivo] =
interaction.customId.split("_select_");



const steamid =
interaction.values[0];



const players =
await getPlayers();



const player =
players.find(
p=>p.SteamID === steamid
);



const nome =
player ?
player.DisplayName :
steamid;



if(acao === "banir"){


await banPlayer(
steamid,
motivo
);


return interaction.update({

content:

`🔨 **PLAYER BANIDO**

👤 ${nome}

🆔 ${steamid}

📝 Motivo:
${motivo}`,

components:[]

});


}



if(acao === "kick"){


await kickPlayer(
steamid,
motivo
);


return interaction.update({

content:

`👢 **PLAYER KICKADO**

👤 ${nome}

🆔 ${steamid}

📝 Motivo:
${motivo}`,

components:[]

});


}



}



module.exports = {

commands,

execute,

handleSelect

};