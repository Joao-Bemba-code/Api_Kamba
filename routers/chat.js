const express = require('express');
const router = express.Router();
const Chat = require('../models/chat.js');
const Projectos = require('../models/projectos.js');
const Users = require('../models/users.js');
const Investimentos = require('../models/investimentos.js');
const { Sequelize } = require('../config/index.js');

// Buscar conversas de um projeto
router.get('/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.query;

        const messages = await Chat.findAll({
            where: {
                projectId: projectId,
                [Sequelize.Op.or]: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            order: [['createdAt', 'ASC']],
            include: [
                {
                    model: Users,
                    as: 'sender',
                    attributes: ['id', 'Nome', 'Type_user']
                },
                {
                    model: Users,
                    as: 'receiver',
                    attributes: ['id', 'Nome', 'Type_user']
                }
            ]
        });

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar conversa'
        });
    }
});

// Enviar mensagem
router.post('/send', async (req, res) => {
    try {
        const { projectId, senderId, receiverId, message, messageType = 'text', fileUrl = null } = req.body;

        const project = await Projectos.findByPk(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projeto não encontrado'
            });
        }

        const sender = await Users.findByPk(senderId);
        if (!sender) {
            return res.status(404).json({
                success: false,
                message: 'Remetente não encontrado'
            });
        }

        const receiver = await Users.findByPk(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Destinatário não encontrado'
            });
        }

        const newMessage = await Chat.create({
            projectId,
            senderId,
            receiverId,
            message,
            messageType,
            fileUrl,
            isRead: false
        });

        const messageWithUser = await Chat.findByPk(newMessage.id, {
            include: [
                {
                    model: Users,
                    as: 'sender',
                    attributes: ['id', 'Nome', 'Type_user']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            data: messageWithUser
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem'
        });
    }
});

// Marcar mensagens como lidas
router.put('/read/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.body;

        await Chat.update(
            { isRead: true },
            {
                where: {
                    projectId: projectId,
                    receiverId: userId,
                    isRead: false
                }
            }
        );

        res.json({
            success: true,
            message: 'Mensagens marcadas como lidas'
        });
    } catch (error) {
        console.error('Erro ao marcar mensagens:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar mensagens'
        });
    }
});

// Buscar mensagens não lidas
router.get('/unread/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const unreadMessages = await Chat.findAll({
            where: {
                receiverId: userId,
                isRead: false
            },
            include: [
                {
                    model: Projectos,
                    as: 'project',
                    attributes: ['id', 'Nome']
                },
                {
                    model: Users,
                    as: 'sender',
                    attributes: ['id', 'Nome', 'Type_user']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const conversations = {};
        unreadMessages.forEach(msg => {
            if (!conversations[msg.projectId]) {
                conversations[msg.projectId] = {
                    project: msg.project,
                    messages: [],
                    unreadCount: 0,
                    lastMessage: msg
                };
            }
            conversations[msg.projectId].messages.push(msg);
            conversations[msg.projectId].unreadCount++;
        });

        res.json({
            success: true,
            totalUnread: unreadMessages.length,
            conversations: Object.values(conversations)
        });
    } catch (error) {
        console.error('Erro ao buscar mensagens não lidas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar notificações'
        });
    }
});

// Rota de participantes
router.get('/participants/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Buscar o projeto com o empreendedor
        const project = await Projectos.findByPk(projectId, {
            include: [
                {
                    model: Users,
                    as: 'owner',
                    attributes: ['id', 'Nome', 'Type_user', 'Email']
                }
            ]
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projeto não encontrado'
            });
        }

        // Buscar investidores que investiram neste projeto
        const investidores = await Investimentos.findAll({
            where: { 
                projectId: projectId, 
                status: 'Confirmado' 
            },
            include: [
                {
                    model: Users,
                    attributes: ['id', 'Nome', 'Type_user', 'Email']
                }
            ]
        });

        // Remover duplicatas de investidores
        const uniqueInvestors = [];
        const investorIds = [];
        
        investidores.forEach(inv => {
            if (inv.User && !investorIds.includes(inv.User.id)) {
                investorIds.push(inv.User.id);
                uniqueInvestors.push(inv.User);
            }
        });

        const participants = {
            entrepreneur: project.owner,
            investors: uniqueInvestors
        };

        res.json({
            success: true,
            participants
        });
    } catch (error) {
        console.error('Erro ao buscar participantes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar participantes'
        });
    }
});

module.exports = router;