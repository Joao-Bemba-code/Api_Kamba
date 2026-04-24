var express = require("express");
var router_projects = express.Router();
var ProjectModel = require("../models/projectos.js");

// Rota para criar o projeto
router_projects.post("/create", async (req, res) => {
    var { 
        Nome, 
        Img, 
        Content, 
        Categ, 
        ValorProjecto, 
        ReceitaEstimada, 
        DuracaoProjecto, 
        Resumo, 
        Iduser,
        Problematica,
        PublicoAlvo,  // Recebe como PublicoAlvo do frontend
        Solucao 
    } = req.body;

    // Validação de campos obrigatórios
    if (!Nome || !Img || !Categ || !ValorProjecto || !ReceitaEstimada || !DuracaoProjecto || !Resumo || !Iduser || !Problematica || !PublicoAlvo || !Solucao) {
        return res.status(400).json({ 
            success: false,
            msg: "Todos os campos são obrigatórios",
            camposFaltantes: {
                Nome: !!Nome,
                Img: !!Img,
                Categ: !!Categ,
                ValorProjecto: !!ValorProjecto,
                ReceitaEstimada: !!ReceitaEstimada,
                DuracaoProjecto: !!DuracaoProjecto,
                Resumo: !!Resumo,
                Iduser: !!Iduser,
                Problematica: !!Problematica,
                PublicoAlvo: !!PublicoAlvo,
                Solucao: !!Solucao
            }
        });
    }

    try {
        await ProjectModel.create({
            Nome,
            Img,
            Content: Content || "", 
            Categ,
            ValorProjecto: parseFloat(ValorProjecto),
            ReceitaEstimada: parseFloat(ReceitaEstimada),
            DuracaoProjecto: parseInt(DuracaoProjecto),
            Resumo,
            Iduser: parseInt(Iduser),
            Problematica,
            Publico: PublicoAlvo, 
            Solucao,
            Status: "Em análise",  
            Estado: "Em análise",
            ValorArrecadado: 0,
            ProbalidadeAi: "0"    
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
router_projects.post("/update/project/:id", async (req, res) => {
    var { Status, ProbalidadeAi } = req.body;
    var { id } = req.params;

    if (!Status || ProbalidadeAi === undefined) {
        return res.status(400).json({ 
            success: false,
            msg: "Status e Probabilidade são obrigatórios" 
        });
    }

    const statusValidos = ["Em análise", "Ativo"];
    if (!statusValidos.includes(Status)) {
        return res.status(400).json({ 
            success: false,
            msg: "Status inválido. Use: Em análise ou Ativo" 
        });
    }

    try {
        var project = await ProjectModel.findOne({ where: { id } });

        if (!project) {
            return res.status(404).json({ 
                success: false,
                msg: "Projeto não encontrado" 
            });
        }

        await ProjectModel.update(
            { 
                Status, 
                ProbalidadeAi: String(ProbalidadeAi)  
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
            where: { Status: "Ativo" },
            order: [['createdAt', 'DESC']]
        });

        const projetosFormatados = projetosAtivos.map(p => ({
            ...p.toJSON(),
            PublicoAlvo: p.Publico  // Mapeia para o nome esperado pelo front
        }));

        return res.status(200).json({ 
            success: true,
            projects: projetosFormatados,
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
            order: [['createdAt', 'DESC']]
        });


        const projetosFormatados = todosProjetos.map(p => ({
            ...p.toJSON(),
            PublicoAlvo: p.Publico
        }));

        return res.status(200).json({ 
            success: true,
            projects: projetosFormatados,
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

// Rota para buscar projetos de um usuário específico
router_projects.get("/project-userId/:id", async (req, res) => {
    var { id } = req.params;

    try {
        var projects = await ProjectModel.findAll({ 
            where: { Iduser: id },
            order: [['createdAt', 'DESC']]
        });


        const projetosFormatados = projects.map(p => ({
            ...p.toJSON(),
            PublicoAlvo: p.Publico
        }));

        return res.status(200).json({
            success: true,
            projects: projetosFormatados,
            total: projects.length
        });

    } catch (e) {
        console.error("Erro ao buscar projetos do usuário:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao buscar projetos",
            error: e.message 
        });
    }
});

// Rota para editar o projeto
router_projects.put("/edit/:id", async (req, res) => {
    const { id } = req.params;
    var { 
        Nome, 
        Img, 
        Content, 
        Categ, 
        ValorProjecto, 
        ReceitaEstimada, 
        DuracaoProjecto, 
        Resumo, 
        Iduser,
        Problematica,
        PublicoAlvo,  
        Solucao 
    } = req.body;

    if (!Nome || !Img || !Categ || !ValorProjecto || !ReceitaEstimada || !DuracaoProjecto || !Resumo || !Iduser || !Problematica || !PublicoAlvo || !Solucao) {
        return res.status(400).json({ 
            success: false,
            msg: "Todos os campos são obrigatórios"
        });
    }

    try {
        const projeto = await ProjectModel.findOne({ where: { id: id } });
        
        if (!projeto) {
            return res.status(404).json({ 
                success: false,
                msg: "Projeto não encontrado" 
            });
        }

        // Verificar se o usuário é dono do projeto
        if (projeto.Iduser != Iduser) {
            return res.status(403).json({
                success: false,
                msg: "Você não tem permissão para editar este projeto"
            });
        }

        await ProjectModel.update({
            Nome,
            Img,
            Content: Content || "",
            Categ,
            ValorProjecto: parseFloat(ValorProjecto),
            ReceitaEstimada: parseFloat(ReceitaEstimada),
            DuracaoProjecto: parseInt(DuracaoProjecto),
            Resumo,
            Problematica,
            Publico: PublicoAlvo,  
            Solucao
        }, {
            where: { id: id }
        });

        const projetoAtualizado = await ProjectModel.findByPk(id);

        const response = {
            ...projetoAtualizado.toJSON(),
            PublicoAlvo: projetoAtualizado.Publico
        };

        return res.status(200).json({ 
            success: true,
            msg: "Projeto editado com sucesso!",
            project: response
        });

    } catch (e) {
        console.error("Erro ao editar projeto:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao editar projeto",
            error: e.message 
        });
    }
});

module.exports = router_projects;