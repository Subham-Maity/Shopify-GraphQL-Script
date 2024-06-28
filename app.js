const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const http = require("http");
const Shopify = require("shopify-api-node");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
require("dotenv").config();

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
  await new Promise((resolve) => server.listen(port, resolve));
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  return server;
}

/**Test Query**/
async function queryProducts(productName) {
  try {
    const response = await axios.post("http://localhost:8000/graphql", {
      query: `
        query($name: String!) {
           getProductsByName(name: $name) {
            title
            variants {
              title
              price
            }
          }
        }
      `,
      variables: { name: productName },
    });

    if (response.data.errors) {
      console.error(
        "GraphQL Errors:",
        JSON.stringify(response.data.errors, null, 2),
      );
      return;
    }
    const products = response.data.data.getProductsByName;
    if (products.length === 0) {
      console.log(`No products found matching "${productName}"`);
      return;
    }
    products.forEach((product) => {
      console.log(product.title);
      product.variants.forEach((variant) => {
        console.log(`- ${variant.title} - price $${variant.price}`);
      });
    });
  } catch (error) {
    console.error("Error details:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    console.error("Error stack:", error.stack);
  }
}
/**Main handle**/
async function main() {
  const server = await startServer();

  const argv = yargs(hideBin(process.argv))
    .option("name", {
      alias: "n",
      describe: "Product name to search",
      type: "string",
      demandOption: true,
    })
    .help().argv;

  await queryProducts(argv.name);

  server.close();
  process.exit();
}

main().catch(console.error);
