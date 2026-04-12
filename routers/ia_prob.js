const express = require('express');
const axios = require('axios');
const router = express.Router();
const ProjectModel = require("../models/projectos.js");

// CONFIGURAÇÃO
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCuv93-Cbo6P6b-w9k1zvQymHOLTW58ha8';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

// Função para analisar projeto com IA
const analyzeWithGemini = async (project, retries = 2) => {
    try {
        const prompt = `Analise este projeto de investimento e dê uma probabilidade de sucesso de 0 a 100.
        
Dados do projeto:
- Nome: ${project.Nome}
- Categoria: ${project.Categ}
- Descrição: ${(project.Content || '').substring(0, 500)}
- Meta de arrecadação: Kz ${project.ValorProjecto}
- ROI: ${project.ReceitaEstimada || 0}%
- Duração: ${project.DuracaoProjecto} dias

Baseado nestes dados, qual a probabilidade de sucesso deste projeto?
Considere que um ROI maior que 30% é um bom indicador.
Responda APENAS com um número inteiro entre 0 e 100.`;

        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 5
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
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
            throw new Error(`IA não retornou número: ${aiText}`);
        }
        
        let prob = parseInt(match[0]);
        
        // Ajuste baseado no ROI
        if (project.ReceitaEstimada > 0) {
            if (project.ReceitaEstimada >= 50) prob = Math.min(100, prob + 15);
            else if (project.ReceitaEstimada >= 30) prob = Math.min(100, prob + 10);
            else if (project.ReceitaEstimada >= 20) prob = Math.min(100, prob + 5);
            else if (project.ReceitaEstimada < 10) prob = Math.max(0, prob - 10);
        }
        
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

// Rota para analisar projeto
router.put('/analyze/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await ProjectModel.findByPk(id);

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Projeto não encontrado' 
            });
        }

        const probability = await analyzeWithGemini(project);
        const status = probability >= 70 ? 'Ativo' : 'Em análise';

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
                roi: project.ReceitaEstimada || 0
            },
            message: `Projeto analisado! Probabilidade: ${probability}%`
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Rota para testar conexão
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
            message: "Erro na conexão com Gemini",
            model: "gemini-2.5-flash",
            error: error.code || error.message
        });
    }
});

module.exports = router;