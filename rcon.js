const WebSocket = require("ws");


let identifier = 0;


function rconCommand(command){

    return new Promise((resolve,reject)=>{


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



        ws.on("error",(err)=>{


            clearTimeout(timeout);


            reject(err);


        });



    });


}



// Lista jogadores online

async function getPlayers(){


    const response = await rconCommand(
        "playerlist"
    );


    try{


        return JSON.parse(response);



    }catch{


        return [];

    }


}



// Dados servidor

async function getServerInfo(){


    const response = await rconCommand(
        "serverinfo"
    );


    return JSON.parse(response);


}



// Ban

async function banPlayer(id,reason){


    return await rconCommand(

        `ban ${id} ${reason}`

    );


}



// Kick

async function kickPlayer(id,reason){


    return await rconCommand(

        `kick ${id} ${reason}`

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