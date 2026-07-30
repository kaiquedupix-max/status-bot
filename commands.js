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



const db = new Database("database.sqlite");



let clientDiscord;



function setClient(client){

    clientDiscord = client;

}





function isAdmin(interaction){

    return interaction.member.roles.cache.has(
        process.env.ADMIN_ROLE_ID
    );

}





function salvarPunicao(data){


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

    `).run(

        data.steamid,
        data.name,
        data.type,
        data.reason,
        data.admin,
        Date.now()

    );


}









async function enviarLog(data){


try{


const channel = await clientDiscord.channels.fetch(

    process.env.BAN_LOG_CHANNEL_ID

);



const embed = new EmbedBuilder()


.setTitle(

"🚨 NOVA PUNIÇÃO"

)


.setDescription(`

━━━━━━━━━━━━━━━

👤 **Jogador**

${data.name}


🆔 **SteamID**

${data.steamid}


🔨 **Ação**

${data.type}


📌 **Motivo**

${data.reason}


👮 **Administrador**

${data.admin}


🕒 <t:${Math.floor(Date.now()/1000)}:F>


🔗 **Apelação**

https://discord.gg/s3J5NCYURD

━━━━━━━━━━━━━━━

`)


.setColor(

data.type === "BAN"

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

.setDescription("Lista jogadores online"),




new SlashCommandBuilder()

.setName("buscar-player")

.setDescription("Busca jogador")

.addStringOption(option =>

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



return interaction.reply({

embeds:[

new EmbedBuilder()

.setTitle(

"📋 Jogadores Online"

)

.setDescription(

players.length

?

players.map(p=>

`👤 **${p.DisplayName}**
🆔 ${p.SteamID}`

).join("\n\n")

:

"🟡 Nenhum jogador online"

)

.setColor("Green")

]

});


}








if(

interaction.commandName === "banir"

){



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







if(

interaction.commandName === "kickar"

){


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







if(

interaction.commandName === "desbanir"

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








if(

interaction.commandName === "buscar-player"

){


const id =

interaction.options.getString(

"steamid"

);



const players =

await getPlayers();



const player =

players.find(

p=>p.SteamID === id

);



return interaction.reply({

embeds:[

new EmbedBuilder()

.setTitle("🔎 Jogador")

.setDescription(`

👤 ${player?.DisplayName || "Offline"}

🆔 ${id}

`)

.setColor("Blue")

]

});



}


}









async function abrirSelecao(interaction,tipo){


const players = await getPlayers();



const menu = new StringSelectMenuBuilder()


.setCustomId(

`${tipo}_select`

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

"🔨 Selecione quem será banido"

:

"👢 Selecione quem será kickado",

components:[

new ActionRowBuilder()

.addComponents(menu)

],

ephemeral:true

});


}


async function handleSelect(interaction){


const steamid = interaction.values[0];

const tipo = interaction.customId.replace(
"_select",
""
);



const modal = new ModalBuilder()

.setCustomId(

`${tipo}_${steamid}`

)

.setTitle(

tipo === "ban"

?

"🔨 Motivo do Ban"

:

"👢 Motivo do Kick"

);





const input = new TextInputBuilder()

.setCustomId("motivo")

.setLabel("Digite o motivo da punição")

.setStyle(

TextInputStyle.Paragraph

)

.setPlaceholder(

"Exemplo: Racismo, cheat, ofensa..."

)

.setRequired(true);





modal.addComponents(

new ActionRowBuilder()

.addComponents(input)

);



await interaction.showModal(modal);


}









async function handleModal(interaction){



const [tipo, steamid] =

interaction.customId.split("_");



const motivo =

interaction.fields.getTextInputValue(

"motivo"

);




const players = await getPlayers();



const player = players.find(

p=>p.SteamID === steamid

);



const nome =

player?.DisplayName || "Desconhecido";





let resposta;





if(tipo === "ban"){



resposta = await banPlayer(

steamid,

nome,

motivo

);



}



if(tipo === "kick"){



resposta = await kickPlayer(

steamid,

motivo

);



}





salvarPunicao({

steamid,

name:nome,

type:tipo.toUpperCase(),

reason:motivo,

admin:interaction.user.tag

});





await enviarLog({

steamid,

name:nome,

type:tipo.toUpperCase(),

reason:motivo,

admin:interaction.user.tag

});







const embed = new EmbedBuilder()

.setTitle(

tipo==="ban"

?

"🔨 BANIMENTO APLICADO"

:

"👢 JOGADOR REMOVIDO"

)

.setDescription(`

━━━━━━━━━━━━━━━


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


━━━━━━━━━━━━━━━


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



const id = interaction.customId;



if(

id.startsWith("ban_")

|| 

id.startsWith("kick_")

){



const tipo = id.split("_")[0];

const steamid = id.split("_")[1];





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






const input = new TextInputBuilder()

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



return interaction.showModal(modal);



}


}









module.exports = {


commands,

execute,

handleSelect,

handleModal,

handleButton,

setClient


};
