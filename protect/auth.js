// middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const user = await Users.findByPk(req.user.id);
    if (!user || !user.IsAdmin) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

module.exports = { verifyToken, verifyAdmin };