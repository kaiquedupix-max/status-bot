require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActivityType
} = require("discord.js");

const { Rcon } = require("rcon-client");


// =============================
// DISCORD CLIENT
// =============================

const client = new Client({

    intents: [
        GatewayIntentBits.Guilds
    ]

});


let statusMessage = null;



// =============================
// CONECTAR NO RUST RCON
// =============================

async function connectRust(){


    let rcon;


    try {


        console.log("🔄 Tentando conectar no RCON...");


        rcon = await Rcon.connect({

            host: process.env.RCON_HOST,

            port: Number(process.env.RCON_PORT),

            password: process.env.RCON_PASSWORD,

            timeout: 15000

        });



        console.log("✅ RCON conectado!");



        const response = await rcon.send(
            "serverinfo"
        );


        console.log("📡 SERVER INFO RECEBIDO:");

        console.log(response);



        await rcon.end();



        return {

            online:true,

            response:response

        };



    } catch(error){


        console.log("❌ ERRO AO CONECTAR RCON:");

        console.log(error.message);



        if(rcon){

            try{

                await rcon.end();

            }catch{}

        }



        return {

            online:false

        };


    }


}




// =============================
// PEGAR JOGADORES ONLINE
// =============================

async function getPlayers(){


    let rcon;


    try{


        console.log("👥 Consultando players...");


        rcon = await Rcon.connect({

            host: process.env.RCON_HOST,

            port: Number(process.env.RCON_PORT),

            password: process.env.RCON_PASSWORD,

            timeout:15000

        });



        const response = await rcon.send(
            "playerlist"
        );


        console.log("📋 PLAYERLIST:");

        console.log(response);



        await rcon.end();



        const players = JSON.parse(response);



        return players.length;



    }catch(error){


        console.log(
            "❌ Erro buscando jogadores:"
        );

        console.log(error.message);



        if(rcon){

            try{

                await rcon.end();

            }catch{}

        }


        return 0;


    }


}




// =============================
// ATUALIZAR STATUS
// =============================

async function updateStatus(){


    try{


        console.log("==============================");

        console.log("🔄 Atualizando painel...");



        const channel = await client.channels.fetch(

            process.env.CHANNEL_ID

        );



        const rust = await connectRust();



        let embed;



        let players = 0;



        if(rust.online){


            players = await getPlayers();



            client.user.setActivity(

                `${process.env.SERVER_NAME} | ${players}/${process.env.MAX_PLAYERS} jogadores`,

                {

                    type: ActivityType.Playing

                }

            );



            embed = new EmbedBuilder()

            .setTitle(
                "🟢 SERVIDOR ONLINE"
            )

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

                text:"Guerra Fria 2x • Monitor"

            });



        }else{


            client.user.setActivity(

                "Servidor offline",

                {

                    type:ActivityType.Playing

                }

            );



            embed = new EmbedBuilder()

            .setTitle(
                "🔴 SERVIDOR OFFLINE"
            )

            .setDescription(
`
🎮 **${process.env.SERVER_NAME}**

Não foi possível conectar ao RCON.

🔄 Nova tentativa em breve...
`
            )

            .setColor("Red");



        }




        if(statusMessage){


            await statusMessage.edit({

                embeds:[
                    embed
                ]

            });


        }else{


            statusMessage = await channel.send({

                embeds:[
                    embed
                ]

            });


        }



        console.log(
            "✅ Painel atualizado!"
        );



    }catch(error){


        console.log(
            "❌ Erro atualizando Discord:"
        );

        console.log(error);


    }


}




// =============================
// BOT ONLINE
// =============================

client.once(
"clientReady",
()=>{


    console.log(
        `🤖 Bot conectado: ${client.user.tag}`
    );



    updateStatus();



    setInterval(

        updateStatus,

        300000

    );


});




// =============================
// LOGIN
// =============================

client.login(

    process.env.DISCORD_TOKEN

);