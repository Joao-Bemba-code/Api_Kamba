const { Sequelize, sequelize } = require("../config/index.js");

var projectos = sequelize.define("projectos",({
    Nome:{type:Sequelize.STRING},
    Img:{type:Sequelize.STRING},
    Content:{type:Sequelize.TEXT},
    Resumo:{type:Sequelize.TEXT},
    Categ:{type:Sequelize.STRING},
    Estado:{type:Sequelize.STRING, defaultValue:"Em análise"},
    ValorProjecto:{type:Sequelize.FLOAT},
    ValorArrecadado:{type:Sequelize.FLOAT, defaultValue:0},
    ReceitaEstimada:{type:Sequelize.FLOAT},
    Status:{type:Sequelize.ENUM("Em análise","Ativo"), defaultValue:"Em análise"},
    DuracaoProjecto:{type:Sequelize.INTEGER},
    ProbalidadeAi:{type:Sequelize.STRING,defaultValue:"0"},
    Iduser:{type:Sequelize.INTEGER},
    Problematica:{type:Sequelize.TEXT},
    Publico:{type:Sequelize.TEXT},
    Solucao:{type:Sequelize.TEXT},

}), {
    timestamps: true
});

module.exports = projectos;