// Netlify function: live, in-stock Shopify listings from the public storefront JSON.
// Does not use Admin API tokens.
//
//   GET /.netlify/functions/shopify               -> slim list of live listings
//   GET /.netlify/functions/shopify?handle=<h>    -> one listing with photos + description
//
// The public /products.json feed returns every product published to the Online
// Store, including sold-out ones (variant.available === false), $0.00 placeholders,
// and the occasional listing CardDealerPro pushed twice with the same SKU. The
// storefront only wants cards a shopper can actually buy, so this function filters
// those out before the browser ever sees them.

const SHOPIFY_DOMAIN = "aventus-elite-cards.myshopify.com";
const PAGE_SIZE = 250;
const MAX_PAGES = 40;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
};

// Raw-card condition values CardDealerPro writes into product tags.
const CONDITION_TAGS = [
    "Gem Mint", "Mint", "Near Mint-Mint", "Near Mint or Better", "Near Mint",
    "Excellent-Mint", "Excellent", "Very Good-Excellent", "Very Good",
    "Good", "Fair", "Poor", "Damaged"
];
const CONDITION_LOOKUP = CONDITION_TAGS.reduce(function (acc, t) {
    acc[t.toLowerCase()] = t;
    return acc;
}, {});

// Grading company + grade, e.g. "PSA 10", "SGC 9.5", "BGS Auth". Requires a space so
// card numbers like "#ASGC-10" or "#RPSA-DC5" are not mistaken for grades.
const GRADE_RE = /(?:^|[\s(])(PSA|BGS|SGC|CGC|BVG|CSG|TAG|HGA|BCCG|Beckett)\s+(10|[1-9](?:\.5)?|Auth(?:entic)?)(?=$|[\s),#])/i;

function tagList(tags) {
    if (Array.isArray(tags)) return tags;
    return String(tags || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
}

function stripHtml(html) {
    return String(html || "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
}

function extractGrade(title, bodyHtml) {
    var m = GRADE_RE.exec(" " + (title || "")) || GRADE_RE.exec(" " + stripHtml(bodyHtml));
    if (!m) return "";
    var company = m[1].toUpperCase() === "BECKETT" ? "BGS" : m[1].toUpperCase();
    var grade = /^auth/i.test(m[2]) ? "Authentic" : m[2];
    return company + " " + grade;
}

function extractCondition(tags) {
    var list = tagList(tags);
    for (var i = 0; i < list.length; i++) {
        var hit = CONDITION_LOOKUP[String(list[i]).trim().toLowerCase()];
        if (hit) return hit;
    }
    return "";
}

// Normalise a products.json product or a /products/<handle>.js product into one shape.
function slim(p, opts) {
    opts = opts || {};
    var variant = (p.variants && p.variants[0]) || {};
    var fromJs = typeof p.price === "number" && p.description !== undefined;
    var price = fromJs ? (variant.price / 100) : parseFloat(variant.price);
    var compare = fromJs
        ? (variant.compare_at_price ? variant.compare_at_price / 100 : null)
        : (variant.compare_at_price ? parseFloat(variant.compare_at_price) : null);
    var images = (p.images || []).map(function (img) {
        var src = typeof img === "string" ? img : (img && img.src);
        if (!src) return "";
        return src.indexOf("//") === 0 ? "https:" + src : src;
    }).filter(Boolean);
    var body = fromJs ? p.description : p.body_html;
    var grade = extractGrade(p.title, body);
    var out = {
        id: p.id,
        handle: p.handle,
        title: p.title,
        vendor: p.vendor || "",
        product_type: p.product_type || p.type || "",
        tags: tagList(p.tags),
        published_at: p.published_at,
        created_at: p.created_at,
        variant_id: variant.id,
        sku: variant.sku || "",
        price: isNaN(price) ? 0 : Math.round(price * 100) / 100,
        compare_at_price: compare,
        available: variant.available !== false,
        images: opts.allImages ? images : images.slice(0, 2),
        grade: grade,
        // A graded slab's condition is its grade; only raw cards get the tag condition.
        condition: grade ? "" : extractCondition(p.tags)
    };
    if (opts.withBody) out.body_html = body || "";
    return out;
}

function isLive(p) {
    return p.available && p.price > 0 && Boolean(p.variant_id);
}

// Drop sold/$0 listings and listings that repeat a SKU (CDP double-push).
// Keeps the copy with a photo, then the oldest.
function liveListings(rawProducts) {
    var stats = { published: rawProducts.length, soldOut: 0, zeroPrice: 0, duplicateSku: 0, duplicateId: 0 };
    var slimmed = rawProducts.map(function (p) { return slim(p); });
    slimmed.sort(function (a, b) {
        var ai = a.images.length ? 0 : 1, bi = b.images.length ? 0 : 1;
        if (ai !== bi) return ai - bi;
        return (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0);
    });
    var seenSku = {}, seenId = {}, live = [];
    slimmed.forEach(function (p) {
        if (seenId[p.id]) { stats.duplicateId++; return; }
        seenId[p.id] = true;
        if (!p.available) { stats.soldOut++; return; }
        if (!(p.price > 0)) { stats.zeroPrice++; return; }
        if (!p.variant_id) { stats.soldOut++; return; }
        if (p.sku) {
            var key = p.sku.toLowerCase();
            if (seenSku[key]) { stats.duplicateSku++; return; }
            seenSku[key] = true;
        }
        live.push(p);
    });
    stats.live = live.length;
    return { products: live, stats: stats };
}

async function fetchAllProducts() {
    var all = [];
    for (var page = 1; page <= MAX_PAGES; page++) {
        var url = "https://" + SHOPIFY_DOMAIN + "/products.json?limit=" + PAGE_SIZE + "&page=" + page;
        var response = await fetch(url);
        if (!response.ok) throw new Error("Shopify products.json failed: " + response.status);
        var data = await response.json();
        var products = (data && data.products) || [];
        if (!products.length) break;
        all = all.concat(products);
        if (products.length < PAGE_SIZE) break;
    }
    return all;
}

async function fetchOne(handle) {
    var url = "https://" + SHOPIFY_DOMAIN + "/products/" + encodeURIComponent(handle) + ".js";
    var response = await fetch(url);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Shopify product lookup failed: " + response.status);
    return response.json();
}

function reply(statusCode, body, cache) {
    return {
        statusCode: statusCode,
        headers: Object.assign({}, corsHeaders, { "Cache-Control": cache || "no-store" }),
        body: JSON.stringify(body)
    };
}

exports.handler = async function (event) {
    try {
        var params = (event && event.queryStringParameters) || {};
        var handle = String(params.handle || "").trim();
        if (handle) {
            if (!/^[a-z0-9][a-z0-9-]{0,254}$/i.test(handle)) return reply(400, { error: "Bad handle" });
            var raw = await fetchOne(handle);
            if (!raw) return reply(404, { error: "Card not found" }, "public, max-age=60");
            var product = slim(raw, { withBody: true, allImages: true });
            product.live = isLive(product);
            return reply(200, { product: product }, "public, max-age=60, must-revalidate");
        }

        var result = liveListings(await fetchAllProducts());
        return reply(200, {
            products: result.products,
            count: result.products.length,
            stats: result.stats
        }, "public, max-age=60, must-revalidate");
    } catch (error) {
        return reply(500, { error: error.message });
    }
};

// Exposed for local tests.
exports._internal = { slim: slim, liveListings: liveListings, extractGrade: extractGrade, extractCondition: extractCondition };
