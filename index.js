var express = require("express");
var app = express();
var cors = require("cors");
var dotenv = require("dotenv");
var router_auth = require("./routers/users.js");
var router_projects = require("./routers/projectos");
var apiIa = require("./routers/ia_prob.js");
var chatRoutes = require("./routers/chat.js");
var investimentosRoutes = require("./routers/investimentos.js");

dotenv.config();

app.use(cors());
app.use(express.json());

// Importar associações (depois que todos os modelos estão definidos)
require("./models/associations.js");

app.use("/auth", router_auth);
app.use("/project", router_projects);
app.use("/api/ai", apiIa);
app.use("/api/chat", chatRoutes);
app.use("/api/investimentos", investimentosRoutes);

app.listen(process.env.PORT, () => {
	console.log("server on!");
});