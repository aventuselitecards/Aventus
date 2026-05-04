// Netlify function to fetch ALL products from Shopify
const SHOPIFY_DOMAIN = 'aventus-elite-cards.myshopify.com';

exports.handler = async (event, context) => {
    try {
        let allProducts = [];
        
        // Keep fetching until no more products
        for (let page = 1; page <= 10; page++) {
            const response = await fetch(`https://${SHOPIFY_DOMAIN}/products.json?limit=250&page=${page}`);
            const data = await response.json();
            
            if (data.products && data.products.length > 0) {
                allProducts = allProducts.concat(data.products);
                console.log(`Fetched page ${page}: ${data.products.length} products`);
            } else {
                console.log(`No more products on page ${page}`);
                break;
            }
        }
        
        console.log(`Total products fetched: ${allProducts.length}`);
        
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