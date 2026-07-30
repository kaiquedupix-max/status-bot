const WebSocket = require("ws");

let identifier = 0;


function debugLog(...args){

    if(process.env.DEBUG_RCON === "true"){

        console.log(...args);

    }

}





function rconCommand(command){

    return new Promise((resolve,reject)=>{


        debugLog(
            "📡 RCON ENVIANDO:",
            command
        );



        const ws = new WebSocket(

            `ws://${process.env.RCON_HOST}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`

        );



        const timeout = setTimeout(()=>{


            ws.close();


            reject(
                new Error("RCON Timeout")
            );


        },15000);






        ws.on("open",()=>{


            debugLog(
                "✅ RCON CONECTADO"
            );



            identifier++;



            ws.send(JSON.stringify({

                Identifier: identifier,

                Message: command,

                Name:"GuerraFriaAdmin"

            }));



        });







        ws.on("message",(data)=>{


            clearTimeout(timeout);



            try{


                const response = JSON.parse(

                    data.toString()

                );



                debugLog(

                    "📥 RCON RESPOSTA:",

                    response.Message

                );



                resolve(

                    response.Message

                );



            }catch(error){



                resolve(

                    data.toString()

                );


            }



            ws.close();



        });







        ws.on("error",(error)=>{


            clearTimeout(timeout);



            console.log(

                "❌ Erro RCON:",

                error.message

            );



            reject(error);



        });







        ws.on("close",()=>{


            debugLog(

                "🔌 RCON DESCONECTADO"

            );


        });



    });


}









// ==========================
// LISTAR PLAYERS
// ==========================


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









// ==========================
// INFO SERVIDOR
// ==========================


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

            MaxPlayers:125,

            Map:"Desconhecido",

            Framerate:0

        };


    }


}









// ==========================
// BAN PERMANENTE
// ==========================


async function banPlayer(

    steamid,

    name,

    reason

){


    const motivo =

    reason?.trim()

    ||

    "Sem motivo informado";





    return await rconCommand(

        `banid "${steamid}" "${name}" "${motivo}"`

    );


}









// ==========================
// BAN TEMPORÁRIO
// ==========================


async function tempBanPlayer(

    steamid,

    name,

    reason,

    duration

){


    const motivo =

    reason?.trim()

    ||

    "Sem motivo informado";





    return await rconCommand(

        `banid "${steamid}" "${name}" "${motivo}" "${duration}"`

    );


}









// ==========================
// KICK
// ==========================


async function kickPlayer(

    steamid,

    reason

){


    const motivo =

    reason?.trim()

    ||

    "Sem motivo informado";





    return await rconCommand(

        `kick "${steamid}" "${motivo}"`

    );


}









// ==========================
// UNBAN
// ==========================


async function unbanPlayer(

    steamid

){


    return await rconCommand(

        `unban "${steamid}"`

    );


}








module.exports = {


    rconCommand,

    getPlayers,

    getServerInfo,

    banPlayer,

    tempBanPlayer,

    kickPlayer,

    unbanPlayer


};