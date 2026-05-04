// Netlify function to fetch ALL products from Shopify using Admin API
// This gets EVERYTHING - no pagination limits

const SHOPIFY_DOMAIN = 'aventus-elite-cards.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

exports.handler = async (event, context) => {
    if (!SHOPIFY_TOKEN) {
        return { statusCode: 500, body: 'Missing Shopify admin token' };
    }
    
    try {
        let allProducts = [];
        let nextPageInfo = null;
        
        // Use Admin API - keeps fetching until no more pages
        do {
            let url = `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/products.json?limit=250`;
            if (nextPageInfo) {
                url += '&page_info=' + nextPageInfo;
            }
            
            const response = await fetch(url, {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            
            const linkHeader = response.headers.get('Link');
            if (linkHeader && linkHeader.includes('next')) {
                // Parse page_info from Link header
                const match = linkHeader.match(/page_info=([^>&]+).*rel="next"/);
                nextPageInfo = match ? match[1] : null;
            } else {
                nextPageInfo = null;
            }
            
            const data = await response.json();
            if (data.products && data.products.length > 0) {
                allProducts = allProducts.concat(data.products);
            }
        } while (nextPageInfo);
        
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
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};