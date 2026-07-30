const WebSocket = require("ws");


let identifier = 0;



function rconCommand(command){

    return new Promise((resolve,reject)=>{


        console.log("📡 RCON ENVIANDO:", command);



        const ws = new WebSocket(

            `ws://${process.env.RCON_HOST}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`

        );



        const timeout = setTimeout(()=>{


            console.log(
                "⏰ RCON TIMEOUT"
            );


            ws.close();


            reject(
                new Error("RCON Timeout")
            );


        },15000);





        ws.on("open",()=>{


            console.log(
                "✅ RCON CONECTADO"
            );



            identifier++;



            ws.send(JSON.stringify({

                Identifier: identifier,

                Message: command,

                Name:"GuerraFriaBot"

            }));


        });







        ws.on("message",(data)=>{


            clearTimeout(timeout);



            let raw =
            data.toString();



            console.log(
                "📥 RCON RESPOSTA:",
                raw
            );



            try{


                const json =
                JSON.parse(raw);



                resolve(
                    json.Message
                );



            }catch{


                resolve(raw);


            }



            ws.close();


        });







        ws.on("error",(error)=>{


            clearTimeout(timeout);



            console.log(
                "❌ RCON ERRO:",
                error.message
            );



            reject(error);


        });




    });

}





// =============================
// JOGADORES ONLINE
// =============================


async function getPlayers(){


    try{


        const response =
        await rconCommand(
            "playerlist"
        );



        return JSON.parse(response);



    }catch(error){


        console.log(
            "Erro playerlist:",
            error.message
        );


        return [];


    }


}







// =============================
// INFORMAÇÕES SERVIDOR
// =============================


async function getServerInfo(){


    try{


        const response =
        await rconCommand(
            "serverinfo"
        );



        return JSON.parse(response);



    }catch(error){


        console.log(
            "Erro serverinfo:",
            error.message
        );



        return {

            Players:0,

            MaxPlayers:125,

            Map:"Offline",

            Framerate:0

        };


    }


}







// =============================
// BAN
// =============================


async function banPlayer(
    steamid,
    reason
){


    return await rconCommand(

        `banid ${steamid} "${reason}"`

    );


}







// =============================
// KICK
// =============================


async function kickPlayer(
    steamid,
    reason
){


    return await rconCommand(

        `kick ${steamid} "${reason}"`

    );


}







// =============================
// UNBAN
// =============================


async function unbanPlayer(
    steamid
){


    return await rconCommand(

        `unban ${steamid}`

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