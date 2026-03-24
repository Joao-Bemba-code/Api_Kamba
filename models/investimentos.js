const { Sequelize, sequelize } = require("../config/index.js");

const Investimentos = sequelize.define("investimentos", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    projectId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    investorId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    amount: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    status: {
        type: Sequelize.ENUM('Pendente', 'Confirmado', 'Cancelado'),
        defaultValue: 'Confirmado'
    },
    paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
    },
    transactionId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    confirmedAt: {
        type: Sequelize.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Investimentos;