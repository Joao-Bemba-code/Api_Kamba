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
            Type_user
        });

        return res.status(201).json({ msg: "Utilizador criado com sucesso!" });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ msg: "Erro interno no servidor" });
    }
});

// LOGIN
router_auth.post("/login", async (req, res) => {
    try {
        const { Email, Senha } = req.body || {};

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
            IsAdmin: user.IsAdmin,
            Status: user.Status,
            Type_user: user.Type_user
        };

        const token = jwt.sign(payload, process.env.SECRET || 'chave_mestra', { expiresIn: '12h' });

        return res.status(200).json({ msg: "Autenticação concluída", token });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ msg: "Erro no processamento do login" });
    }
});

// Listar todos os usuários
router_auth.get("/users", async (req, res) => {
    try {
        const users = await Users.findAll({
            attributes: { exclude: ['Senha'] } // Não enviar senhas
        });

        return res.status(200).json({ 
            success: true,
            users,
            total: users.length 
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao buscar usuários" 
        });
    }
});

// Rota para o admin atualizar um usuário específico (USAR PUT, NÃO GET)
router_auth.put("/update/:id", async (req, res) => {
    try {
        const { Nome, Email, Bio, Status } = req.body;
        const { id } = req.params;

        // Validação correta
        if (!Nome || !Email || Status === undefined) {
            return res.status(400).json({ 
                success: false,
                msg: "Nome, Email e Status são obrigatórios" 
            });
        }

        // Verificar se o usuário existe
        const user = await Users.findOne({ where: { id } });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                msg: "Usuário não encontrado" 
            });
        }

        // Preparar dados para atualização
        const updateData = {
            Nome,
            Email,
            Status
        };

        // Só adicionar Bio se foi fornecida
        if (Bio !== undefined) {
            updateData.Bio = Bio;
        }

        // Atualizar usuário
        await Users.update(updateData, { where: { id } });

        return res.status(200).json({ 
            success: true,
            msg: "Usuário atualizado com sucesso" 
        });

    } catch (e) {
        console.error("Erro ao atualizar usuário:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao atualizar usuário" 
        });
    }
});

// Rota para o próprio usuário atualizar seu perfil
router_auth.put("/user-update/:id", async (req, res) => {
    try {
        const { Nome,Bio } = req.body;

        const {id} = req.params;

        if (!Nome) {
            return res.status(400).json({ 
                success: false,
                msg: "Nome e Email são obrigatórios" 
            });
        }

        const user = await Users.findOne({ where: { id } });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                msg: "Usuário não encontrado" 
            });
        }

        const updateData = {
            Nome
        };

        if (Bio !== undefined) {
            updateData.Bio = Bio;
        }

        await Users.update(updateData, { where: { id } });

        return res.status(200).json({ 
            success: true,
            msg: "Perfil atualizado com sucesso" 
        });

    } catch (e) {
        console.error("Erro ao atualizar perfil:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao atualizar perfil" 
        });
    }
});

router_auth.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await Users.findOne({ where: { id } });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                msg: "Usuário não encontrado" 
            });
        }

        await Users.destroy({ where: { id } });

        return res.status(200).json({ 
            success: true,
            msg: "Usuário eliminado com sucesso" 
        });

    } catch (e) {
        console.error("Erro ao eliminar usuário:", e);
        return res.status(500).json({ 
            success: false,
            msg: "Erro interno ao eliminar usuário" 
        });
    }
});

router_auth.put("/changePassword", async(req,res)=>{

    var {Email,NewPassword} = req.body;

    if(!Email || !NewPassword){
        return res.status(409).json({msg:"nenhum campo deve estar vazio", success:false});
    }


    var verificar_user = await Users.findOne({where:{Email:Email}});

    try{

       if(!verificar_user){
         return res.status(409).json({msg:"houve um erro qualquer",success:false});
       }

       var salt = 10;

       var Senha_hash = await bcr.hash(NewPassword, salt);

       await Users.update({Senha:Senha_hash},{where:{Email:Email}});

       return res.status(200).json({msg:"Senha resposta com sucesso",success:true});

    }catch(e){
        return res.status(500).json({msg:"houve um erro interno", success:false});
    }
})

module.exports = router_auth;