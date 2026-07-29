require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActivityType
} = require("discord.js");

const Rcon = require("rcon");


// ==========================
// DISCORD
// ==========================

const client = new Client({

    intents:[
        GatewayIntentBits.Guilds
    ]

});


let statusMessage = null;


// ==========================
// RCON RUST
// ==========================

function connectRust(){


    return new Promise((resolve)=>{


        console.log("🔄 Iniciando conexão RCON...");


        const rcon = new Rcon(

            process.env.RCON_HOST,

            Number(process.env.RCON_PORT),

            process.env.RCON_PASSWORD

        );



        let finished = false;



        rcon.on("auth",()=>{


            console.log("✅ RCON autenticado com sucesso");


            rcon.send("serverinfo");


        });



        rcon.on("response",(response)=>{


            console.log("📡 Resposta do Rust:");

            console.log(response);



            if(!finished){

                finished = true;


                rcon.disconnect();



                resolve({

                    online:true,

                    response:response

                });

            }


        });



        rcon.on("error",(error)=>{


            console.log("❌ Erro RCON:");

            console.log(error);



            if(!finished){

                finished=true;


                resolve({

                    online:false

                });

            }


        });



        rcon.on("end",()=>{


            console.log("🔌 RCON desconectado");


        });



        rcon.connect();



    });

}



// ==========================
// CONTAR PLAYERS
// ==========================

async function getPlayers(){


    return new Promise((resolve)=>{


        const rcon = new Rcon(

            process.env.RCON_HOST,

            Number(process.env.RCON_PORT),

            process.env.RCON_PASSWORD

        );



        rcon.on("auth",()=>{


            console.log("👥 Buscando jogadores...");


            rcon.send("playerlist");


        });



        rcon.on("response",(response)=>{


            console.log("📋 PLAYERLIST:");

            console.log(response);



            try{


                const players = JSON.parse(response);


                resolve(players.length);



            }catch{


                resolve(0);

            }



            rcon.disconnect();



        });



        rcon.on("error",(error)=>{


            console.log("❌ Erro playerlist:");

            console.log(error);


            resolve(0);


        });



        rcon.connect();


    });


}



// ==========================
// ATUALIZAR DISCORD
// ==========================


async function updateStatus(){


    console.log("==============================");

    console.log("🔄 Atualizando status");



    const channel = await client.channels.fetch(

        process.env.CHANNEL_ID

    );



    const connection = await connectRust();



    let players = 0;



    if(connection.online){


        players = await getPlayers();


    }



    let embed;



    if(connection.online){



        client.user.setActivity(

            `${process.env.SERVER_NAME} | ${players}/${process.env.MAX_PLAYERS} jogadores`,

            {

                type:ActivityType.Playing

            }

        );



        embed = new EmbedBuilder()

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

            text:"Guerra Fria Status System"

        });



    }else{


        client.user.setActivity(

            "Servidor offline",

            {

                type:ActivityType.Playing

            }

        );



        embed = new EmbedBuilder()

        .setTitle("🔴 SERVIDOR OFFLINE")

        .setDescription(
`
🎮 **${process.env.SERVER_NAME}**

Não foi possível conectar no RCON.

🔄 Tentando novamente...
`
        )

        .setColor("Red");


    }



    if(statusMessage){


        await statusMessage.edit({

            embeds:[embed]

        });


    }else{


        statusMessage = await channel.send({

            embeds:[embed]

        });


    }



    console.log("✅ Embed atualizado");

}



// ==========================
// BOT READY
// ==========================


client.once("clientReady",()=>{


    console.log(
        `🤖 Bot conectado: ${client.user.tag}`
    );


    updateStatus();



    setInterval(

        updateStatus,

        300000

    );


});



// ==========================
// LOGIN
// ==========================

client.login(

    process.env.DISCORD_TOKEN

);