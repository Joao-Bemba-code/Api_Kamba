const { Sequelize, sequelize } = require("../config/index.js");

const Users = sequelize.define("Users", {
    Nome: { 
        type: Sequelize.STRING 
    },
    Email: { 
        type: Sequelize.STRING,
        unique: true
    },
    Senha: { 
        type: Sequelize.STRING
    },
    Type_user: { 
        type: Sequelize.ENUM("entrepreneur", "investor"), 
        allowNull: false
    },
    IsAdmin: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
    },
    Status:{
        type:Sequelize.ENUM("Ativo","Pendente","Bloqueado"),
        defaultValue:"Pendente"
    },
    Bio:{
        type:Sequelize.STRING
    },
});

module.exports = Users;