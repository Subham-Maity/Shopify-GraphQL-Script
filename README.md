# Shopify GraphQL

A script (`app.js`) that communicates with Shopify through GraphQL APIs. It fetches products by name and lists their variants, sorted by price.

## Example

```bash
node app.js --name glove
```

Output:
```
My Glove - variant A - price $20
Your Gloves - variant X - price $22
My Glove - variant B - price $25
```

## How to Run

### Install

```bash
pnpm i
```

### Environment Setup

Create a `.env` file with the following content:

```
SHOPIFY_DOMAIN="https://subham-test-store.myshopify.com/admin/api/2024-06"
SHOPIFY_ACCESS_TOKEN="shpat_aa******************22b1a5de89b8"
SHOP_NAME="subham-test-store"
PORT="8000"
```

### Execute Script

```bash
node app.js --name "shirt"
```

## Additional Client Testing

To test the server:

1. Move `run.js` to the main directory or create a similar `.env` file in the `run` folder.

2. Run the following command:

```bash
node run.js
```

3. Test using a GraphQL client (like GraphQL Playground) or send a POST request to `http://localhost:8000/graphql` with the following query:

```graphql
query {
  getProductsByName(name: "shirt") {
    title
    variants {
      title
      price
    }
  }
}
```

### Testing with Axios

```js
const axios = require('axios');

async function testQuery() {
  try {
    const response = await axios.post('http://localhost:8000/graphql', {
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
      `
    });

    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery();
```
