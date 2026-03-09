const express = require("express");
const router_auth = express.Router();
const bcr = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/users.js");

// REGISTO
router_auth.post("/register", async (req, res) => {
    try {
        const { Nome, Email, Senha, Type_user } = req.body || {};

        if (!Nome || !Email || !Senha || !Type_user) {
            return res.status(400).json({ msg: "Todos os campos são obrigatórios" });
        }

        const userExists = await Users.findOne({ where: { Email } });
        if (userExists) {
            return res.status(409).json({ msg: "Este email já está registado" });
        }

        const salt = await bcr.genSalt(10);
        const senhaCriptografada = await bcr.hash(Senha, salt);

        await Users.create({ 
            Nome, 
            Email, 
            Senha: senhaCriptografada, 
            Type_user });

        return res.status(201).json({ msg: "Utilizador criado com sucesso!" });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ msg: "Erro interno no servidor" });
    }
});

// LOGIN
router_auth.post("/login", async (req, res) => {
    try {
        const { Email, Senha } = req.body || {}; // Extraímos a Sen hera aqui

        if (!Email || !Senha) {
            return res.status(400).json({ msg: "Email e Senha são obrigatórios" });
        }

        const user = await Users.findOne({ where: { Email } });
        if (!user) {
            return res.status(401).json({ msg: "Credenciais incorretas" });
        }

        const senhaValida = await bcr.compare(Senha, user.Senha);
        if (!senhaValida) {
            return res.status(401).json({ msg: "Credenciais incorretas" });
        }

        const payload = { 
            id: user.id, 
            Nome: user.Nome, 
            IsAdmin: user.IsAdmin 
        };

        const token = jwt.sign(payload, process.env.SECRET || 'chave_mestra', { expiresIn: '12h' });

        return res.status(200).json({ msg: "Autenticação concluída", token });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ msg: "Erro no processamento do login" });
    }
});

module.exports = router_auth;
