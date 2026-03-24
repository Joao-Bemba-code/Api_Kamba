const { Sequelize, sequelize } = require("../config/index.js");

const Chat = sequelize.define("chats", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'projectos',
            key: 'id'
        }
    },
    senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    receiverId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    message: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    fileUrl: {
        type: Sequelize.STRING,
        allowNull: true
    },
    messageType: {
        type: Sequelize.ENUM('text', 'image', 'file'),
        defaultValue: 'text'
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Chat;