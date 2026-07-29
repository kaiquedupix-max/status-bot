require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActivityType
} = require("discord.js");

const { Rcon } = require("rcon-client");


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});


let statusMessage;


async function getRustPlayers() {

    try {

        const rcon = await Rcon.connect({
            host: process.env.RCON_HOST,
            port: Number(process.env.RCON_PORT),
            password: process.env.RCON_PASSWORD
        });


        const response = await rcon.send("playerlist");


        await rcon.end();


        const players = response
            .split("\n")
            .filter(line => line.includes("steamid"));


        return players.length;


    } catch (error) {

        console.log("Erro RCON:", error.message);

        return null;
    }
}



async function updateStatus(){


    const channel = await client.channels.fetch(
        process.env.CHANNEL_ID
    );


    const players = await getRustPlayers();


    if(players === null){


        client.user.setActivity(
            "Servidor offline",
            {
                type: ActivityType.Playing
            }
        );


        return;

    }



    client.user.setActivity(
        `${process.env.SERVER_NAME} | ${players}/${process.env.MAX_PLAYERS} jogadores`,
        {
            type: ActivityType.Playing
        }
    );



    const embed = new EmbedBuilder()

    .setTitle("🟢 SERVIDOR ONLINE")

    .setDescription(
`
🎮 **${process.env.SERVER_NAME}**

👥 **Jogadores:**
${players}/${process.env.MAX_PLAYERS}

🌎 **IP:**
${process.env.GAME_IP}

⏱ **Atualizado:**
<t:${Math.floor(Date.now()/1000)}:R>
`
)

.setColor("Green")

.setFooter({
text:"Sistema de monitoramento Rust"
});



    if(!statusMessage){

        statusMessage = await channel.send({
            embeds:[embed]
        });

    }else{


        await statusMessage.edit({
            embeds:[embed]
        });

    }

}



client.once("ready",()=>{

    console.log(
        `Bot online: ${client.user.tag}`
    );


    updateStatus();


    setInterval(
        updateStatus,
        300000
    );

});



client.login(
    process.env.DISCORD_TOKEN
);