require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActivityType
} = require("discord.js");

const { Rcon } = require("rcon-client");


// Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});


let statusMessage = null;



// ===============================
// CONEXÃO RCON RUST
// ===============================

async function getRustStatus() {

    let rcon;

    try {

        console.log("🔄 Conectando no RCON...");


        rcon = await Rcon.connect({

            host: process.env.RCON_HOST,

            port: Number(process.env.RCON_PORT),

            password: process.env.RCON_PASSWORD

        });



        console.log("✅ RCON conectado");


        const response = await rcon.send("playerlist");


        console.log("📡 Resposta Rust:");
        console.log(response);



        await rcon.end();



        let players = 0;


        try {

            const data = JSON.parse(response);

            players = data.length;


        } catch {

            console.log(
                "⚠️ Não foi possível converter JSON"
            );

        }



        return {

            online: true,

            players: players

        };



    } catch(error){


        console.log("❌ ERRO RCON:");
        console.log(error);


        if(rcon){

            try {

                await rcon.end();

            } catch {}

        }


        return {

            online:false,

            players:0

        };

    }

}




// ===============================
// ATUALIZA STATUS
// ===============================

async function updateStatus(){


    try {


        const channel = await client.channels.fetch(
            process.env.CHANNEL_ID
        );


        const rust = await getRustStatus();



        let embed;



        if(!rust.online){


            client.user.setActivity(
                "Servidor offline",
                {
                    type: ActivityType.Playing
                }
            );



            embed = new EmbedBuilder()

            .setTitle("🔴 SERVIDOR OFFLINE")

            .setDescription(
`
🎮 **${process.env.SERVER_NAME}**

O servidor não respondeu ao RCON.

🔄 Tentando reconectar...
`
            )

            .setColor("Red")

            .setTimestamp();



        } else {



            client.user.setActivity(

                `${process.env.SERVER_NAME} | ${rust.players}/${process.env.MAX_PLAYERS} jogadores`,

                {
                    type: ActivityType.Playing
                }

            );



            embed = new EmbedBuilder()

            .setTitle("🟢 SERVIDOR ONLINE")

            .setDescription(
`
🎮 **${process.env.SERVER_NAME}**

👥 **Jogadores:**
${rust.players}/${process.env.MAX_PLAYERS}

🌎 **IP:**
${process.env.GAME_IP}

⏱ **Atualizado:**
<t:${Math.floor(Date.now()/1000)}:R>
`
            )

            .setColor("Green")

            .setFooter({

                text:"Rust Monitor System"

            })

            .setTimestamp();

        }



        if(statusMessage){


            await statusMessage.edit({

                embeds:[embed]

            });


        } else {


            statusMessage = await channel.send({

                embeds:[embed]

            });


        }



        console.log(
            "✅ Status atualizado"
        );



    } catch(error){

        console.log(
            "Erro atualizando Discord:"
        );

        console.log(error);

    }

}





// ===============================
// BOT ONLINE
// ===============================

client.once("ready",()=>{


    console.log(
        `🤖 Bot conectado: ${client.user.tag}`
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