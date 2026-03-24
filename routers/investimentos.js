const express = require('express');
const router = express.Router();
const Investimentos = require('../models/investimentos.js');
const Projectos = require('../models/projectos.js');
const Users = require('../models/users.js');

// Criar investimento
router.post('/create', async (req, res) => {
    try {
        const { projectId, investorId, amount, paymentMethod } = req.body;

        const project = await Projectos.findByPk(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projeto não encontrado'
            });
        }

        if (project.Status !== 'Ativo') {
            return res.status(400).json({
                success: false,
                message: 'Projeto não está disponível para investimento'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valor inválido'
            });
        }

        const investimento = await Investimentos.create({
            projectId,
            investorId,
            amount,
            paymentMethod,
            status: 'Confirmado',
            confirmedAt: new Date()
        });

        const novoValorArrecadado = (project.ValorArrecadado || 0) + amount;
        await project.update({
            ValorArrecadado: novoValorArrecadado
        });

        const investimentoCompleto = await Investimentos.findByPk(investimento.id, {
            include: [
                {
                    model: Projectos,
                    attributes: ['id', 'Nome', 'ValorProjecto', 'ValorArrecadado']
                },
                {
                    model: Users,
                    attributes: ['id', 'Nome']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Investimento realizado com sucesso!',
            data: investimentoCompleto
        });
    } catch (error) {
        console.error('Erro ao criar investimento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar investimento'
        });
    }
});

// Buscar investimentos do investidor
router.get('/investor/:investorId', async (req, res) => {
    try {
        const { investorId } = req.params;

        const investimentos = await Investimentos.findAll({
            where: { investorId },
            include: [
                {
                    model: Projectos,
                    attributes: ['id', 'Nome', 'Img', 'Categ', 'ValorProjecto', 'ValorArrecadado', 'Status', 'ProbalidadeAi', 'ReceitaEstimada']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            investimentos
        });
    } catch (error) {
        console.error('Erro ao buscar investimentos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar investimentos'
        });
    }
});

// Buscar investimentos de um projeto
router.get('/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        const investimentos = await Investimentos.findAll({
            where: { projectId },
            include: [
                {
                    model: Users,
                    attributes: ['id', 'Nome']
                }
            ]
        });

        const totalInvestido = investimentos.reduce((sum, inv) => sum + inv.amount, 0);

        res.json({
            success: true,
            investimentos,
            totalInvestido
        });
    } catch (error) {
        console.error('Erro ao buscar investimentos do projeto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar investimentos'
        });
    }
});

// Buscar estatísticas do investidor
router.get('/stats/:investorId', async (req, res) => {
    try {
        const { investorId } = req.params;

        const investimentos = await Investimentos.findAll({
            where: { investorId, status: 'Confirmado' },
            include: [
                {
                    model: Projectos,
                    attributes: ['Status', 'ReceitaEstimada']
                }
            ]
        });

        const totalInvestido = investimentos.reduce((sum, inv) => sum + inv.amount, 0);
        const totalProjetos = investimentos.length;
        const projetosAtivos = investimentos.filter(inv => inv.Project?.Status === 'Ativo').length;

        res.json({
            success: true,
            stats: {
                totalInvestido,
                totalProjetos,
                projetosAtivos,
                totalInvestimentos: investimentos.length
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar estatísticas'
        });
    }
});

module.exports = router;