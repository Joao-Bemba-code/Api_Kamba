const express = require('express');
const axios = require('axios');
const router = express.Router();
const ProjectModel = require("../models/projectos.js");

const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA4MMq8Ey8e2tMRUf7D4zoC3qGPO7jQXSU';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

const calculateROI = (valorMeta, receitaEstimada) => {
    const meta = parseFloat(valorMeta) || 0;
    const receita = parseFloat(receitaEstimada) || 0;
    
    if (meta <= 0) return 0;
    
    const lucro = receita - meta;
    const roi = (lucro / meta) * 100;
    
    return Math.round(roi * 10) / 10;
};

const analyzeWithGemini = async (project, retries = 2) => {
    try {
        const roiCalculado = calculateROI(project.ValorProjecto, project.ReceitaEstimada);
        
        const prompt = `Voce e um analista de investimentos profissional especializado em avaliar projetos de startups e negocios inovadores.

Sua tarefa e analisar o projeto abaixo e retornar APENAS um numero inteiro de 0 a 100 representando a probabilidade de sucesso do projeto.

DADOS DO PROJETO

Nome: ${project.Nome || 'Nao informado'}
Categoria: ${project.Categ || 'Nao informado'}
Meta de investimento: Kz ${project.ValorProjecto || 0}
Receita estimada: Kz ${project.ReceitaEstimada || 0}
ROI calculado: ${roiCalculado}%
Duracao: ${project.DuracaoProjecto || 0} dias

PROBLEMATICA
${(project.Problematica || 'NAO INFORMADO').substring(0, 500)}

PUBLICO ALVO
${(project.PublicoAlvo || project.Publico || 'NAO INFORMADO').substring(0, 400)}

SOLUCAO PROPOSTA
${(project.Solucao || 'NAO INFORMADO').substring(0, 500)}

DESCRICAO COMPLETA
${(project.Content || project.Resumo || 'NAO INFORMADO').substring(0, 500)}

CRITERIOS DE AVALIACAO

1. Clareza da problematica (0 a 25 pontos)
Problema muito claro com dados concretos: 20-25 pontos
Problema bem definido mas sem dados quantitativos: 15-19 pontos
Problema identificado mas descricao vaga: 10-14 pontos
Problema inexistente ou mal formulado: 0-9 pontos

2. Definicao do publico alvo (0 a 20 pontos)
Publico especifico dimensionado com poder de compra: 16-20 pontos
Publico definido mas sem dados de tamanho de mercado: 11-15 pontos
Publico muito amplo ou indefinido: 6-10 pontos
Publico alvo nao especificado: 0-5 pontos

3. Qualidade da solucao (0 a 25 pontos)
Solucao inovadora com diferencial competitivo claro: 20-25 pontos
Solucao adequada mas sem diferencial obvio: 15-19 pontos
Solucao copiada de concorrentes: 10-14 pontos
Solucao inexistente ou inviavel: 0-9 pontos

4. Viabilidade financeira (0 a 15 pontos)
ROI maior que 30% e meta realista: 12-15 pontos
ROI entre 20% e 30% e meta moderada: 8-11 pontos
ROI entre 10% e 20%: 4-7 pontos
ROI menor que 10% ou dados inconsistentes: 0-3 pontos

5. Potencial de mercado e duracao (0 a 15 pontos)
Mercado grande com prazo adequado: 12-15 pontos
Mercado medio com prazo razoavel: 8-11 pontos
Mercado limitado ou prazo inadequado: 4-7 pontos
Mercado inexistente ou prazo inviavel: 0-3 pontos

Some os pontos de cada criterio e retorne APENAS o numero total entre 0 e 100.
Nao escreva explicacoes, apenas o numero.`;

        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 5
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000,
                httpAgent: new require('http').Agent({ keepAlive: true }),
                httpsAgent: new require('https').Agent({ keepAlive: true })
            }
        );

        const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) {
            throw new Error('Resposta vazia da IA');
        }
        
        const match = aiText.match(/\d+/);
        
        if (!match) {
            throw new Error(`IA nao retornou numero: ${aiText}`);
        }
        
        let prob = parseInt(match[0]);
        
        if (roiCalculado > 0) {
            if (roiCalculado >= 50) prob = Math.min(100, prob + 15);
            else if (roiCalculado >= 30) prob = Math.min(100, prob + 10);
            else if (roiCalculado >= 20) prob = Math.min(100, prob + 5);
            else if (roiCalculado < 10) prob = Math.max(0, prob - 10);
        }
        
        if (project.Problematica && project.Problematica.length > 50) prob = Math.min(100, prob + 3);
        if ((project.PublicoAlvo || project.Publico) && (project.PublicoAlvo || project.Publico).length > 30) prob = Math.min(100, prob + 2);
        if (project.Solucao && project.Solucao.length > 50) prob = Math.min(100, prob + 3);
        
        return Math.min(100, Math.max(0, prob));

    } catch (error) {
        console.error(`Erro na tentativa (${3-retries}):`, error.code || error.message);
        
        if (retries > 0 && (error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND')) {
            console.log(`Aguardando 2 segundos e tentando novamente...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return analyzeWithGemini(project, retries - 1);
        }
        
        throw new Error(error.response?.data?.error?.message || error.message || 'Falha ao conectar com a API Gemini');
    }
};

// ROTA APENAS PARA ANÁLISE (NÃO ALTERA STATUS)
router.put('/analyze-only/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await ProjectModel.findByPk(id);

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Projeto nao encontrado' 
            });
        }

        const probability = await analyzeWithGemini(project);
        const roiCalculado = calculateROI(project.ValorProjecto, project.ReceitaEstimada);

        // ATUALIZA APENAS A PROBABILIDADE, MANTÉM O STATUS ORIGINAL
        await project.update({
            ProbalidadeAi: probability.toString()
        });

        return res.json({
            success: true,
            data: { 
                id: project.id, 
                probability, 
                currentStatus: project.Status,
                roi: roiCalculado
            },
            message: `Projeto analisado! Probabilidade: ${probability}% | ROI: ${roiCalculado}% | Status atual: ${project.Status}`
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ROTA PARA APROVAR PROJETO MANUALMENTE (MANTÉM PROBABILIDADE DA IA SE EXISTIR)
router.put('/approve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await ProjectModel.findByPk(id);

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Projeto nao encontrado' 
            });
        }

        // Mantém a probabilidade já calculada (se existir)
        const currentProbability = project.ProbalidadeAi;
        
        // Apenas atualiza o status para 'Ativo'
        await project.update({
            Status: 'Ativo'
        });

        return res.json({
            success: true,
            data: { 
                id: project.id, 
                status: 'Ativo',
                probability: currentProbability || 'Aguardando análise'
            },
            message: `Projeto aprovado manualmente! Status: Ativo | Probabilidade IA: ${currentProbability || 'Aguardando análise'}%`
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ROTA PARA ANALISAR E APROVAR AUTOMATICAMENTE (BASEADO NA PROBABILIDADE)
router.put('/analyze-and-approve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await ProjectModel.findByPk(id);

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Projeto nao encontrado' 
            });
        }

        const probability = await analyzeWithGemini(project);
        const roiCalculado = calculateROI(project.ValorProjecto, project.ReceitaEstimada);
        
        // Decide status baseado na probabilidade
        const status = probability >= 70 ? 'Ativo' : 'Em analise';

        await project.update({
            ProbalidadeAi: probability.toString(),
            Status: status
        });

        return res.json({
            success: true,
            data: { 
                id: project.id, 
                probability, 
                status,
                roi: roiCalculado
            },
            message: `Projeto analisado! Probabilidade: ${probability}% | ROI: ${roiCalculado}% | Status: ${status}`
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ROTA PARA ATUALIZAR APENAS O STATUS MANUALMENTE
router.put('/update-status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const project = await ProjectModel.findByPk(id);

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Projeto nao encontrado' 
            });
        }

        const validStatuses = ['Ativo', 'Em analise', 'Pendente', 'Bloqueado', 'Concluido'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status inválido. Use: ${validStatuses.join(', ')}`
            });
        }

        // Mantém a probabilidade inalterada
        await project.update({
            Status: status
        });

        return res.json({
            success: true,
            data: { 
                id: project.id, 
                status,
                probability: project.ProbalidadeAi || 'N/A'
            },
            message: `Status do projeto atualizado para: ${status} | Probabilidade IA mantida: ${project.ProbalidadeAi || 'N/A'}%`
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ROTA PARA OBTER ANÁLISE SEM ALTERAR NADA (APENAS CONSULTA)
router.get('/analyze-preview/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await ProjectModel.findByPk(id);

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Projeto nao encontrado' 
            });
        }

        // Faz análise mas não salva no banco
        const probability = await analyzeWithGemini(project);
        const roiCalculado = calculateROI(project.ValorProjecto, project.ReceitaEstimada);

        return res.json({
            success: true,
            data: { 
                id: project.id, 
                probability,
                roi: roiCalculado,
                currentStatus: project.Status,
                existingProbability: project.ProbalidadeAi
            },
            message: `Pré-visualização da análise: Probabilidade: ${probability}% | ROI: ${roiCalculado}%`
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});


router.get('/test', async (req, res) => {
    try {
        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [{
                    parts: [{ text: "Diga apenas: OK" }]
                }]
            },
            {
                timeout: 10000,
                httpAgent: new require('http').Agent({ keepAlive: true }),
                httpsAgent: new require('https').Agent({ keepAlive: true })
            }
        );

        const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        res.json({
            success: true,
            message: "API Gemini funcionando perfeitamente",
            model: "gemini-2.5-flash",
            reply: reply?.trim()
        });
    } catch (error) {
        console.error('Erro no teste:', error.code || error.message);
        res.status(500).json({
            success: false,
            message: "Erro na conexao com Gemini",
            model: "gemini-2.5-flash",
            error: error.code || error.message
        });
    }
});

module.exports = router;