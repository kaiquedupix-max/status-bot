require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActivityType
} = require("discord.js");

const WebSocket = require("ws");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});


let statusMessage = null;
let requestId = 0;



// ======================================
// RUST WEB RCON
// ======================================

function rustCommand(command){

    return new Promise((resolve, reject)=>{


        console.log("🔄 Abrindo Web RCON...");


        const ws = new WebSocket(
            `ws://${process.env.RCON_HOST}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`
        );



        const timeout = setTimeout(()=>{

            console.log("❌ Timeout Web RCON");

            ws.close();

            reject(
                new Error("Timeout Web RCON")
            );

        },15000);



        ws.on("open",()=>{


            console.log("✅ Web RCON conectado");


            requestId++;


            ws.send(JSON.stringify({

                Identifier: requestId,

                Message: command,

                Name:"RustStatusBot"

            }));


        });



        ws.on("message",(data)=>{


            clearTimeout(timeout);


            const response = data.toString();


            console.log("📡 Resposta Rust:");

            console.log(response);



            ws.close();


            resolve(response);


        });



        ws.on("error",(error)=>{


            clearTimeout(timeout);


            console.log("❌ Erro Web RCON:");

            console.log(error);


            reject(error);


        });


    });


}




// ======================================
// PEGAR PLAYERS
// ======================================

async function getPlayers(){


    try{


        const response = await rustCommand(
            "playerlist"
        );


        const data = JSON.parse(response);


        return data.length;



    }catch(error){


        console.log(
            "Erro contando players:",
            error.message
        );


        return 0;

    }


}




// ======================================
// ATUALIZAR STATUS
// ======================================

async function updateStatus(){


    try{


        console.log("==============================");

        console.log("🔄 Atualizando status");



        const channel = await client.channels.fetch(
            process.env.CHANNEL_ID
        );



        let online = true;


        try{

            await rustCommand(
                "serverinfo"
            );


        }catch{

            online=false;

        }



        let embed;



        if(online){


            const players = await getPlayers();



            client.user.setActivity(

                `${process.env.SERVER_NAME} | ${players}/${process.env.MAX_PLAYERS} jogadores`,

                {
                    type:ActivityType.Playing
                }

            );



            embed = new EmbedBuilder()

            .setTitle(
                "🟢 SERVIDOR ONLINE"
            )

            .setDescription(
`
🎮 **${process.env.SERVER_NAME}**

👥 **Jogadores**
${players}/${process.env.MAX_PLAYERS}

🌎 **IP**
${process.env.GAME_IP}

⏱ **Atualizado**
<t:${Math.floor(Date.now()/1000)}:R>
`
            )

            .setColor("Green");


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

Sem resposta do RCON.
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


        console.log(
            "✅ Status enviado"
        );


    }catch(error){


        console.log(
            "❌ Erro geral:"
        );

        console.log(error);


    }

}




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



client.login(
    process.env.DISCORD_TOKEN
);