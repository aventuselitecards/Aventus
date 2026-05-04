// Netlify function to fetch products from Shopify
// This bypasses CORS restrictions

const SHOPIFY_DOMAIN = 'aventus-elite-cards.myshopify.com';

exports.handler = async (event, context) => {
    try {
        // Fetch products from Shopify (server-side, no CORS)
        const response = await fetch(`https://${SHOPIFY_DOMAIN}/products.json?limit=250`);
        const data = await response.json();
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products: data.products || [],
                count: data.products?.length || 0
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};