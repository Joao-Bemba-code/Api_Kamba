var Sequelize = require("sequelize");

var sequelize = new Sequelize("Kamba","root","0518",{
	host:"localhost",
	dialect:"mysql"
});

sequelize.authenticate().then(()=>{
	console.log("dB conectado com sucesso");
}).catch((e)=>{
	console.log("houve um erro ao conectar a db", e);
});

module.exports = {Sequelize,sequelize};