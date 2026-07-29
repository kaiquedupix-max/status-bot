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

    try {

        const rcon = await Rcon.connect({

            host: "157.85.89.141",

            port: 27336,

            password: "cd1df9f3f91c",

            timeout: 10000

        });


        console.log("✅ CONECTOU NO RCON");


        const response = await rcon.send("serverinfo");


        console.log("RESPOSTA SERVER:");
        console.log(response);


        await rcon.end();


        return {
            online:true,
            players:0
        };


    } catch(error){

        console.log("❌ RCON FALHOU:");
        console.log(error);

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