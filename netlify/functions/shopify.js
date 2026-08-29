// Netlify function: live published products from public products.json
// Does not use Admin API tokens. Draft/unpublished Shopify items and CollX-only
// inventory will not appear here.

const SHOPIFY_DOMAIN = "aventus-elite-cards.myshopify.com";
const PAGE_SIZE = 250;
const MAX_PAGES = 40;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
};

exports.handler = async function () {
    try {
        var allProducts = [];

        for (var page = 1; page <= MAX_PAGES; page++) {
            var url = "https://" + SHOPIFY_DOMAIN + "/products.json?limit=" + PAGE_SIZE + "&page=" + page;
            var response = await fetch(url);
            if (!response.ok) {
                throw new Error("Shopify products.json failed: " + response.status);
            }
            var data = await response.json();
            var products = (data && data.products) || [];
            if (!products.length) break;
            allProducts = allProducts.concat(products);
            if (products.length < PAGE_SIZE) break;
        }

        return {
            statusCode: 200,
            headers: Object.assign({}, corsHeaders, {
                "Cache-Control": "public, max-age=60, must-revalidate"
            }),
            body: JSON.stringify({
                products: allProducts,
                count: allProducts.length
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: Object.assign({}, corsHeaders, {
                "Cache-Control": "no-store"
            }),
            body: JSON.stringify({ error: error.message })
        };
    }
};
