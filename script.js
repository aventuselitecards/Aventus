// Shopify config - Using public products.json (no token needed for basic access)
const SHOPIFY_DOMAIN = "aventus-elite-cards.myshopify.com";
const SHOPIFY_API = `https://${SHOPIFY_DOMAIN}/products.json?limit=250`;

// Contact form handling
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = new FormData(this);
    alert(`Thanks ${data.get('name')}! Your message has been sent.`);
    this.reset();
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

function getShopifyLink(handle) {
    return `https://aventus-elite-cards.myshopify.com/products/${handle}`;
}

function formatPrice(price) {
    return '$' + parseFloat(price).toFixed(2);
}

// Pagination state
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 50;

// Load inventory from Shopify
async function loadInventory() {
    const inventoryGrid = document.getElementById('inventory-grid');
    const featuredGrid = document.getElementById('featured-grid');
    
    try {
        inventoryGrid.innerHTML = '<div class="card-placeholder"><div class="card-image">⏳</div><p class="coming-soon">Loading cards...</p></div>';
        
        const response = await fetch(SHOPIFY_API);
        const data = await response.json();
        allProducts = data.products || [];
        filteredProducts = allProducts;
    } catch (e) {
        console.error(e);
        inventoryGrid.innerHTML = '<div class="card-placeholder"><div class="card-image">⚠️</div><p class="coming-soon">Error loading. Refresh?</p></div>';
        return;
    }
    
    if (allProducts.length > 0) {
        // Featured = top 6 most expensive
        const sorted = [...allProducts].sort((a,b) => b.variants[0].price - a.variants[0].price);
        displayFeaturedCards(sorted.slice(0, 6));
        displayInventoryPage();
        initControls();
    }
}

// Display featured
function displayFeaturedCards(products) {
    const featuredGrid = document.getElementById('featured-grid');
    if (!products.length) return;
    
    featuredGrid.innerHTML = products.map(p => {
        const v = p.variants?.[0], img = p.images?.[0]?.src;
        return `<div class="card-item featured-card"><div class="featured-badge">💎</div><div class="card-image">${img ? `<img src="${img}" alt="${p.title}">` : '🃏'}</div><div class="card-info"><h3>${p.title}</h3><p class="card-team">${p.vendor||''}</p><span class="card-grade">$${v?.price}+</span><p class="card-price">${formatPrice(v?.price)}</p><a href="${getShopifyLink(p.handle)}" target="_blank" class="shopify-button">View</a></div></div>`;
    }).join('');
}

// Display inventory page
function displayInventoryPage() {
    const grid = document.getElementById('inventory-grid');
    const info = document.getElementById('page-info');
    const prev = document.getElementById('prev-page');
    const next = document.getElementById('next-page');
    
    const start = (currentPage - 1) * productsPerPage;
    const pageProds = filteredProducts.slice(start, start + productsPerPage);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    grid.innerHTML = pageProds.map(p => {
        const v = p.variants?.[0], img = p.images?.[0]?.src;
        return `<div class="card-item"><div class="card-image">${img ? `<img src="${img}" alt="${p.title}">` : '🃏'}</div><div class="card-info"><h3>${p.title}</h3><p class="card-team">${p.vendor||''}</p><p class="card-price">${formatPrice(v?.price)}</p><a href="${getShopifyLink(p.handle)}" target="_blank" class="shopify-button">View</a></div></div>`;
    }).join('');
    
    if (info) info.textContent = `Page ${currentPage}/${totalPages}`;
    if (prev) prev.disabled = currentPage === 1;
    if (next) next.disabled = currentPage === totalPages;
}

// Controls
function initControls() {
    const s = document.getElementById('search-input');
    const srt = document.getElementById('sort-select');
    if (s) s.addEventListener('input', e => {
        currentPage = 1;
        filteredProducts = e.target.value ? allProducts.filter(p => p.title.toLowerCase().includes(e.target.value.toLowerCase())) : allProducts;
        displayInventoryPage();
    });
    if (srt) srt.addEventListener('change', e => {
        currentPage = 1;
        const v = e.target.value;
        filteredProducts = [...allProducts].sort((a,b) => v==='name'?a.title.localeCompare(b.title):v==='price'?a.variants[0].price-b.variants[0].price:b.variants[0].price-a.variants[0].price);
        displayInventoryPage();
    });
    document.getElementById('prev-page')?.addEventListener('click', () => currentPage > 1 && (currentPage--, displayInventoryPage()));
    document.getElementById('next-page')?.addEventListener('click', () => currentPage < Math.ceil(filteredProducts.length/productsPerPage) && (currentPage++, displayInventoryPage()));
}

// Init
document.addEventListener('DOMContentLoaded', loadInventory);