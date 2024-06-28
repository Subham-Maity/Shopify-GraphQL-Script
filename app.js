const express = require('express')
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require('dotenv').config();
const http =  require('http');
//Example : `https://subham-test-store.myshopify.com/admin/api/2024-06`
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    console.error('Missing SHOPIFY_DOMAIN or SHOPIFY_ACCESS_TOKEN environment variable');
    process.exit(1);
}



//let's start the server
async function startServer() {
    const app = express();

    const port = process.env.PORT || 4000;

    app.use(bodyParser.json());
    app.use(cors());

    app.use(express.json());

    app.use(express.urlencoded({extended: true}));

    const server = http.createServer(app);
    server.listen(port, () => {
        console.log(`🚀 Server ready at XXXXXXXXXXXXXXXX:${port}`);
    }).on(
        'error',
        (err) => {
            console.log(err);
            process.exit();
        }
    );
}

startServer().then(r=>console.log("Server started"));




