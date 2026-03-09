const { Sequelize, sequelize } = require("../config/index.js");

const Users = sequelize.define("Users", {
    Nome: { 
        type: Sequelize.STRING 
    },
    Email: { 
        type: Sequelize.STRING,
        unique: true // Boa prática para emails
    },
    Senha: { 
        type: Sequelize.STRING // CHAR sem tamanho é muito curto para hashes de bcrypt
    },
    Type_user: { 
        // IMPORTANTE: O ENUM deve conter exatamente o que o frontend envia
        type: Sequelize.ENUM("entrepreneur", "investor"), 
        allowNull: false
    },
    IsAdmin: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
    }
})
module.exports = Users;
