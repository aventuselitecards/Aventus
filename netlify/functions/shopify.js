// Netlify function to fetch products from Shopify
// This bypasses CORS restrictions and gets ALL products

const SHOPIFY_DOMAIN = 'aventus-elite-cards.myshopify.com';

exports.handler = async (event, context) => {
    try {
        let allProducts = [];
        
        // Fetch all pages
        for (let page = 1; page <= 5; page++) {
            const response = await fetch(`https://${SHOPIFY_DOMAIN}/products.json?limit=250&page=${page}`);
            const data = await response.json();
            
            if (data.products && data.products.length > 0) {
                allProducts = allProducts.concat(data.products);
            } else {
                break;
            }
        }
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products: allProducts,
                count: allProducts.length
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};