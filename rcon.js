const WebSocket = require("ws");

let identifier = 0;


function rconCommand(command){

    return new Promise((resolve, reject)=>{


        console.log("📡 RCON ENVIANDO:", command);


        const ws = new WebSocket(

            `ws://${process.env.RCON_HOST}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`

        );


        const timeout = setTimeout(()=>{


            console.log("⏰ RCON TIMEOUT");


            ws.close();


            reject(
                new Error("RCON Timeout")
            );


        },15000);



        ws.on("open",()=>{


            console.log("✅ RCON CONECTADO");


            identifier++;


            ws.send(JSON.stringify({

                Identifier: identifier,

                Message: command,

                Name:"GuerraFriaBot"

            }));


        });



        ws.on("message",(data)=>{


            clearTimeout(timeout);



            const response = data.toString();



            console.log(
                "📥 RCON RESPOSTA:",
                response
            );



            try{


                const json = JSON.parse(response);


                resolve(json.Message);



            }catch{


                resolve(response);


            }



            ws.close();



        });



        ws.on("error",(err)=>{


            clearTimeout(timeout);


            console.log(
                "❌ RCON ERRO:",
                err.message
            );


            reject(err);



        });



        ws.on("close",()=>{


            console.log(
                "🔌 RCON DESCONECTADO"
            );


        });



    });


}




// Lista jogadores online

async function getPlayers(){


    try{


        const response = await rconCommand(
            "playerlist"
        );


        return JSON.parse(response);



    }catch(error){


        console.log(
            "❌ Erro playerlist:",
            error.message
        );


        return [];


    }


}





// Dados do servidor

async function getServerInfo(){


    try{


        const response = await rconCommand(
            "serverinfo"
        );


        return JSON.parse(response);



    }catch(error){


        console.log(
            "❌ Erro serverinfo:",
            error.message
        );


        return {

            Players:0,

            MaxPlayers:0,

            Map:"Offline",

            Framerate:0

        };


    }


}





// Ban

async function banPlayer(id, reason){


    return await rconCommand(

        `ban ${id} "${reason}"`

    );


}





// Kick

async function kickPlayer(id, reason){


    return await rconCommand(

        `kick ${id} "${reason}"`

    );


}





// Unban

async function unbanPlayer(id){


    return await rconCommand(

        `unban ${id}`

    );


}





module.exports = {


    rconCommand,

    getPlayers,

    getServerInfo,

    banPlayer,

    kickPlayer,

    unbanPlayer


};