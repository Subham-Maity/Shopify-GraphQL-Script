const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const http = require("http");
const Shopify = require("shopify-api-node");

/**Secret Key handle**/
//Example : `https://subham-test-store.myshopify.com/admin/api/2024-06`
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
//Example : `sha_1234567890abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz`
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
  console.error(
    "Missing SHOPIFY_DOMAIN or SHOPIFY_ACCESS_TOKEN environment variable",
  );
  process.exit(1);
}

/**Shopify API for Fetch**/
//Example : `subham-test-store`
const SHOP_NAME = process.env.SHOP_NAME;

const shopify = new Shopify({
  shopName: SHOP_NAME,
  accessToken: SHOPIFY_ACCESS_TOKEN,
});

/**GraphQl**/
const apolloServer = new ApolloServer({
  typeDefs: `
            type ProductVariant {
                id: ID!
                title: String!
                price: String!
            }

            type Product {
                id: ID!
                title: String!
                variants: [ProductVariant!]!
            }

            type Query {
                getProductsByName(name: String!): [Product]
            }
        `,
  // Endpoint and queries - https://shopify.dev/docs/api/admin-graphql#endpoints
  resolvers: {
    Query: {
      getProductsByName: async (_, { name }) => {
        const query = `
            query($query: String!) {
                products(first: 10, query: $query) {
                    edges {
                        node {
                            id
                            title
                            variants(first: 10) {
                                edges {
                                    node {
                                        id
                                        title
                                        price
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
          const response = await shopify.graphql(query, { query: name });

          return response.products.edges.map((edge) => ({
            id: edge.node.id,
            title: edge.node.title,
            variants: edge.node.variants.edges
              .map((variantEdge) => ({
                id: variantEdge.node.id,
                title: variantEdge.node.title,
                price: variantEdge.node.price,
              }))
              .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
          }));
        } catch (error) {
          console.error("Error fetching products:", error);
          throw new Error("Failed to fetch products");
        }
      },
    },
  },
});

/**Server handle**/
async function startServer() {
  const app = express();
  const port = process.env.PORT || 4000;
  app.use(bodyParser.json());
  app.use(cors());

  //ApolloServer Start
  apolloServer.start().then(() => {
    app.use("/graphql", expressMiddleware(apolloServer));
  });

  const server = http.createServer(app);
  server
    .listen(port, () => {
      console.log(`🚀 Server ready at ZZZzzzzz....:${port}`);
    })
    .on("error", (err) => {
      console.log(err);
      process.exit();
    });
}
async function testQuery() {
  try {
    const response = await axios.post("http://localhost:8000/graphql", {
      query: `
        query {
          getProductsByName(name: "shirt") {
            title
            variants {
              title
              price
            }
          }
        }
      `,
    });

    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testQuery().then((r) => console.log("Your product started"));
startServer().then((r) => console.log("Server started"));
