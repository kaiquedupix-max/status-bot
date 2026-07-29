require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActivityType
} = require("discord.js");

const WebSocket = require("ws");


const client = new Client({
    intents:[
        GatewayIntentBits.Guilds
    ]
});


let statusMessage = null;
let identifier = 0;



// ================================
// WEB RCON RUST
// ================================

function rustCommand(command){

    return new Promise((resolve,reject)=>{


        const ws = new WebSocket(

            `ws://${process.env.RCON_HOST}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`

        );


        const timeout = setTimeout(()=>{

            ws.close();

            reject(
                new Error("Timeout RCON")
            );

        },15000);



        ws.on("open",()=>{


            identifier++;


            ws.send(JSON.stringify({

                Identifier:identifier,

                Message:command,

                Name:"GuerraFriaBot"

            }));


        });



        ws.on("message",(data)=>{


            clearTimeout(timeout);


            try{


                const json = JSON.parse(
                    data.toString()
                );


                resolve(json.Message);



            }catch{


                resolve(
                    data.toString()
                );


            }



            ws.close();


        });



        ws.on("error",(error)=>{


            clearTimeout(timeout);

            reject(error);


        });


    });

}



// ================================
// STATUS RUST
// ================================

async function getRustInfo(){


    try{


        const response = await rustCommand(
            "serverinfo"
        );



        const data = JSON.parse(response);



        return {

            online:true,

            hostname:data.Hostname,

            players:data.Players,

            maxPlayers:data.MaxPlayers,

            map:data.Map,

            fps:data.Framerate

        };



    }catch(error){


        console.log(
            "❌ Erro Rust:",
            error.message
        );


        return {

            online:false

        };


    }


}



// ================================
// ATUALIZA DISCORD
// ================================

async function updateStatus(){


    try{


        const channel = await client.channels.fetch(

            process.env.CHANNEL_ID

        );



        const rust = await getRustInfo();



        let embed;



        if(rust.online){



            client.user.setActivity(

                `Guerra Fria | ${rust.players}/${rust.maxPlayers} jogadores`,

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
🎮 **${rust.hostname}**

👥 **Jogadores**
${rust.players}/${rust.maxPlayers}

🗺️ **Mapa**
${rust.map}

⚡ **FPS**
${rust.fps}

🌎 **IP**
${process.env.GAME_IP}

🔄 **Atualização**
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

            .setTitle(
                "🔴 SERVIDOR OFFLINE"
            )

            .setDescription(
`
🎮 Guerra Fria 2x

Servidor sem resposta.
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
            "✅ Status atualizado"
        );


    }catch(error){


        console.log(
            "❌ Erro Discord:",
            error.message
        );


    }


}




// ================================
// BOT ONLINE
// ================================

client.once("clientReady",()=>{


    console.log(
        `🤖 Online: ${client.user.tag}`
    );


    updateStatus();



    setInterval(

        updateStatus,

        60000

    );


});



client.login(
    process.env.DISCORD_TOKEN
);