var express = require("express");
var router_projects = express.Router();
var ProjectModel = require("../models/projectos.js"); // Renomeado para evitar conflito

// Rota para criar o projeto
router_projects.post("/create", async (req, res) => {
    var { Nome, Img, Content, Categ, ValorProjecto, ReceitaEstimada, DuracaoProjecto, Resumo, Iduser } = req.body;

    // Validação de campos obrigatórios
    if (!Nome || !Img || !Categ || !ValorProjecto || !ReceitaEstimada || !DuracaoProjecto || !Resumo) {
        return res.status(400).json({ 
            msg: "Todos os campos são obrigatórios",
            campos: { Nome, Img, Categ, ValorProjecto, ReceitaEstimada, DuracaoProjecto, Resumo,Iduser }
        });
    }

    try {
        await ProjectModel.create({
            Nome,
            Img,
            Content: Content || "", 
            Categ,
            ValorProjecto,
            ReceitaEstimada,
            DuracaoProjecto,
            Resumo,
            Iduser
        });

        return res.status(201).json({ 
            success: true,
            msg: "Projeto criado com sucesso! Aguarde análise." 
        });

    } catch (e) {
        console.error("Erro ao criar projeto:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao criar projeto",
            error: e.message 
        });
    }
});

// Rota para atualizar/aprovar o projeto
router_projects.post("/update/project/:id",async (req, res) => {
    var { Status, ProbalidadeAi } = req.body;
    var { id } = req.params;

    // Validação de campos obrigatórios
    if (!Status || ProbalidadeAi === undefined) {
        return res.status(400).json({ 
            msg: "Status e Probabilidade são obrigatórios" 
        });
    }

    // Validação do status
    const statusValidos = ["Pendente", "Em Análise", "Ativo", "Rejeitado", "Concluído"];
    if (!statusValidos.includes(Status)) {
        return res.status(400).json({ 
            msg: "Status inválido. Use: Pendente, Em Análise, Ativo, Rejeitado ou Concluído" 
        });
    }

    try {
        // Verificar se o projeto existe
        var project = await ProjectModel.findOne({ where: { id } });

        if (!project) {
            return res.status(404).json({ 
                msg: "Projeto não encontrado" 
            });
        }

        // Atualizar o projeto
        await ProjectModel.update(
            { 
                Status, 
                ProbalidadeAi: parseFloat(ProbalidadeAi) // Garantir que é número
            },
            { where: { id: id } }
        );

        return res.status(200).json({ 
            success: true,
            msg: "Projeto atualizado com sucesso" 
        });

    } catch (e) {
        console.error("Erro ao atualizar projeto:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao atualizar projeto",
            error: e.message 
        });
    }
});

// Rota para buscar projetos aprovados (Status "Ativo")
router_projects.get("/projectos-auth", async (req, res) => {
    try {
        var projetosAtivos = await ProjectModel.findAll({ 
            where: { Status: "Ativo" } 
        });

        return res.status(200).json({ 
            success: true,
            projetos: projetosAtivos,
            total: projetosAtivos.length
        });

    } catch (e) {
        console.error("Erro ao buscar projetos ativos:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao buscar projetos",
            error: e.message 
        });
    }
});

// Rota para buscar todos os projetos
router_projects.get("/projectos-all", async (req, res) => {
    try {
        var todosProjetos = await ProjectModel.findAll({
            order: [['createdAt', 'DESC']] // Ordenar por data de criação
        });

        return res.status(200).json({ 
            success: true,
            projets: todosProjetos,
            total: todosProjetos.length
        });

    } catch (e) {
        console.error("Erro ao buscar todos os projetos:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao buscar projetos",
            error: e.message 
        });
    }
});

// Rota para buscar um projeto específico por ID
router_projects.get("/project-userId/:id", async (req, res) => {

    var { id } = req.params;

    try {
        var projects = await ProjectModel.findAll({ where: { Iduser:id } });

        if (projects.length < 1) {
            return res.status(404).json({ 
                success: false,
                msg: "Projetos não encontrado" 
            });
        }

        return res.status(200).json({
            projects
        });

    } catch (e) {
        console.error("Erro ao buscar projeto:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao buscar projeto",
            error: e.message 
        });
    }
});

module.exports = router_projects;