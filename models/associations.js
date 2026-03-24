const Users = require('./users.js');
const Projectos = require('./projectos.js');
const Investimentos = require('./investimentos.js');
const Chat = require('./chat.js');

// Associações de Investimentos (SEM ALIAS DUPLICADO)
Investimentos.belongsTo(Users, { foreignKey: 'investorId' });
Investimentos.belongsTo(Projectos, { foreignKey: 'projectId' });
Users.hasMany(Investimentos, { foreignKey: 'investorId' });
Projectos.hasMany(Investimentos, { foreignKey: 'projectId' });

// Associações de Chat
Chat.belongsTo(Users, { as: 'sender', foreignKey: 'senderId' });
Chat.belongsTo(Users, { as: 'receiver', foreignKey: 'receiverId' });
Users.hasMany(Chat, { as: 'sentMessages', foreignKey: 'senderId' });
Users.hasMany(Chat, { as: 'receivedMessages', foreignKey: 'receiverId' });

Chat.belongsTo(Projectos, { as: 'project', foreignKey: 'projectId' });
Projectos.hasMany(Chat, { as: 'chats', foreignKey: 'projectId' });

// Associação de Projectos com Users (owner)
Projectos.belongsTo(Users, { as: 'owner', foreignKey: 'Iduser' });
Users.hasMany(Projectos, { as: 'projects', foreignKey: 'Iduser' });

console.log('Associações configuradas com sucesso!');