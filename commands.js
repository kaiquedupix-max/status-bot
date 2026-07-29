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



function isAdmin(interaction){

    return interaction.member.roles.cache.has(
        process.env.ADMIN_ROLE_ID
    );

}




const commands = [

new SlashCommandBuilder()
.setName("listar-player")
.setDescription("Lista jogadores online"),


new SlashCommandBuilder()
.setName("buscar-player")
.setDescription("Busca jogador pelo SteamID")
.addStringOption(option =>
    option
    .setName("steamid")
    .setDescription("SteamID do jogador")
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
.setDescription("Remove ban pelo SteamID")
.addStringOption(option =>
    option
    .setName("steamid")
    .setDescription("SteamID")
    .setRequired(true)
)

];





async function execute(interaction){


if(interaction.commandName === "listar-player"){


const players = await getPlayers();



if(!players.length){

return interaction.reply({
content:"❌ Nenhum jogador online.",
ephemeral:true
});

}



let lista = players.map((p,i)=>

`**${i+1}. ${p.DisplayName}**\n🆔 ${p.SteamID}`

).join("\n\n");



const embed = new EmbedBuilder()

.setTitle("📋 PLAYERS ONLINE")

.setDescription(lista)

.setColor("Green")

.setFooter({
text:`Total: ${players.length} jogadores`
});



return interaction.reply({
embeds:[embed]
});

}





if(interaction.commandName === "banir"){


if(!isAdmin(interaction))
return interaction.reply({
content:"❌ Sem permissão.",
ephemeral:true
});



return abrirSelecao(
interaction,
"ban"
);


}






if(interaction.commandName === "kickar"){


if(!isAdmin(interaction))
return interaction.reply({
content:"❌ Sem permissão.",
ephemeral:true
});


return abrirSelecao(
interaction,
"kick"
);


}






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
"❌ Player não está online.",

ephemeral:true

});

}



const embed = new EmbedBuilder()

.setTitle("🔎 PLAYER")

.setDescription(
`
👤 **${player.DisplayName}**
🆔 ${player.SteamID}
🔗 https://steamcommunity.com/profiles/${player.SteamID}

❤️ Vida: ${Math.round(player.Health)}
📶 Ping: ${player.Ping}ms
👥 Team: ${player.TeamID}

📍 X:${player.Position.x}
Y:${player.Position.y}
Z:${player.Position.z}
`
)

.setColor("Blue");



return interaction.reply({
embeds:[embed]
});

}





if(interaction.commandName==="desbanir"){


if(!isAdmin(interaction))
return interaction.reply({
content:"❌ Sem permissão.",
ephemeral:true
});


const id =
interaction.options.getString("steamid");


await unbanPlayer(id);



return interaction.reply({

content:
`✅ Ban removido\n🆔 ${id}`

});


}


}







async function abrirSelecao(interaction,tipo){



const players =
await getPlayers();



if(!players.length){

return interaction.reply({
content:"❌ Nenhum player online.",
ephemeral:true
});

}



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

value:p.SteamID

}))

);



return interaction.reply({

content:
tipo==="ban"
?
"🔨 Escolha quem será banido:"
:
"👢 Escolha quem será kickado:",


components:[

new ActionRowBuilder()
.addComponents(menu)

]

});


}








async function handleSelect(interaction){



const steam =
interaction.values[0];



const tipo =
interaction.customId;



const modal = new ModalBuilder()

.setCustomId(
`${tipo}_${steam}`
)

.setTitle(
tipo==="ban_player"
?
"Motivo do Ban"
:
"Motivo do Kick"
);



const input =
new TextInputBuilder()

.setCustomId("motivo")

.setLabel("Digite o motivo")

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



const [tipo,steam] =
interaction.customId.split("_");



const motivo =
interaction.fields.getTextInputValue(
"motivo"
);



const players =
await getPlayers();



const player =
players.find(
p=>p.SteamID===steam
);



const nome =
player?.DisplayName || steam;




if(tipo==="ban"){


await banPlayer(
steam,
motivo
);


return interaction.reply({

embeds:[

new EmbedBuilder()

.setTitle("🔨 BAN APLICADO")

.setDescription(
`
👤 ${nome}
🆔 ${steam}
📝 ${motivo}
👮 ${interaction.user}
`
)

.setColor("Red")

]

});


}




if(tipo==="kick"){


await kickPlayer(
steam,
motivo
);


return interaction.reply({

embeds:[

new EmbedBuilder()

.setTitle("👢 KICK APLICADO")

.setDescription(
`
👤 ${nome}
🆔 ${steam}
📝 ${motivo}
👮 ${interaction.user}
`
)

.setColor("Orange")

]

});


}


}





module.exports = {

commands,

execute,

handleSelect,

handleModal

};