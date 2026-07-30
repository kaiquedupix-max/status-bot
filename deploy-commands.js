require("dotenv").config();


const {

    REST,

    Routes

} = require("discord.js");



const {

    commands

} = require("./commands");







const rest = new REST({

    version:"10"

}).setToken(

    process.env.DISCORD_TOKEN

);








async function deploy(){


try{



console.log(

"🔄 Registrando comandos..."

);





await rest.put(


Routes.applicationGuildCommands(

process.env.CLIENT_ID,

process.env.GUILD_ID

),



{

body:

commands.map(

cmd=>cmd.toJSON()

)

}



);





console.log(

"✅ Comandos registrados com sucesso!"

);





}catch(error){



console.log(

"❌ Erro ao registrar comandos:"

);



console.log(error);



}



}






deploy();