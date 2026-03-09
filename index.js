var express = require("express");

var app = express();

var cors = require("cors");

var dotenv = require("dotenv");

var router_auth = require("./routers/users.js");

dotenv.config();

//configs

app.use(cors());
app.use(express.json());

//rotas
app.use("/auth", router_auth)

app.listen(process.env.PORT, ()=>{

	console.log("server on!");

})