// Contact form handling
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    // For now, show an alert (you can connect to a real backend later)
    alert(`Thanks ${data.name}! Your message has been sent. We'll be in touch at ${data.email} soon.`);
    
    this.reset();
});

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Shopify store URL
const SHOPIFY_URL = "https://aventus-elite-cards.myshopify.com";
const SHOPIFY_API = "https://aventus-elite-cards.myshopify.com/products.json";

// Create Shopify product link
function getShopifyLink(handle) {
    return `${SHOPIFY_URL}/products/${handle}`;
}

// Format price
function formatPrice(price) {
    return '$' + parseFloat(price).toFixed(2);
}

// Load inventory from Shopify
async function loadInventory() {
    const inventoryGrid = document.getElementById('inventory-grid');
    const featuredGrid = document.getElementById('featured-grid');
    
    try {
        inventoryGrid.innerHTML = '<div class="card-placeholder"><div class="card-image">⏳</div><p class="coming-soon">Loading from Shopify...</p></div>';
        
        // Fetch ALL products (handling pagination)
        let allProducts = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
            const response = await fetch(`${SHOPIFY_URL}/products.json?limit=250&page=${page}`);
            const data = await response.json();
            if (data.products && data.products.length > 0) {
                allProducts = allProducts.concat(data.products);
                page++;
            } else {
                hasMore = false;
            }
        }
        
        console.log('Total products loaded:', allProducts.length);
        const products = allProducts;
        
        if (products && products.length > 0) {
            // Display all products
            displayInventory(products);
            
            // Featured section - show top 6 most expensive
            const featured = [...products].sort((a, b) => b.variants[0].price - a.variants[0].price).slice(0, 6);
            displayFeaturedCards(featured);
        } else {
            inventoryGrid.innerHTML = '<div class="card-placeholder"><div class="card-image">📦</div><p class="coming-soon">No products found</p></div>';
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        inventoryGrid.innerHTML = '<div class="card-placeholder"><div class="card-image">❌</div><p class="coming-soon">Error: ' + error.message + '</p></div>';
    }
}

function displayFeaturedCards(products) {
    const featuredGrid = document.getElementById('featured-grid');
    
    if (!products || products.length === 0) {
        featuredGrid.innerHTML = '';
        return;
    }
    
    featuredGrid.innerHTML = products.slice(0, 6).map(product => {
        const variant = product.variants[0];
        const image = product.images[0] ? product.images[0].src : '';
        
        return `
        <div class="card-item featured-card">
            <div class="featured-badge">💎 PREMIUM</div>
            <div class="card-image">
                ${image ? `<img src="${image}" alt="${product.title}" onerror="this.parentElement.innerHTML='🃏'">` : '🃏'}
            </div>
            <div class="card-info">
                <h3>${product.title}</h3>
                <p class="card-team">${product.vendor || ''}</p>
                <span class="card-grade featured-grade">${variant.price > 100 ? '$100+' : 'In Stock'}</span>
                <p class="card-price featured-price">${formatPrice(variant.price)}</p>
                <a href="${getShopifyLink(product.handle)}" target="_blank" class="shopify-button">🛒 Buy on Shopify</a>
            </div>
        </div>
    `}).join('');
}

// Pagination and search state
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 50;

// Initialize search and pagination
function initControls() {
    const searchInput = document.getElementById('search-input');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    currentPage = 1;
    
    if (query.trim() === '') {
        filteredProducts = allProducts;
    } else {
        filteredProducts = allProducts.filter(p => 
            p.title.toLowerCase().includes(query) ||
            (p.vendor && p.vendor.toLowerCase().includes(query))
        );
    }
    
    displayInventoryPage();
}

function changePage(delta) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const newPage = currentPage + delta;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayInventoryPage();
    }
}

function displayInventoryPage() {
    const inventoryGrid = document.getElementById('inventory-grid');
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const pageProducts = filteredProducts.slice(start, end);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (pageProducts.length === 0) {
        inventoryGrid.innerHTML = '<div class="card-placeholder"><div class="card-image">🔍</div><p class="coming-soon">No cards found</p></div>';
    } else {
        inventoryGrid.innerHTML = pageProducts.map(product => {
            const variant = product.variants[0];
            const image = product.images[0] ? product.images[0].src : '';
            
            return `
            <div class="card-item">
                <div class="card-image">
                    ${image ? `<img src="${image}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='🃏'">` : '🃏'}
                </div>
                <div class="card-info">
                    <h3>${product.title}</h3>
                    <p class="card-team">${product.vendor || ''}</p>
                    <p class="card-price">${formatPrice(variant.price)}</p>
                    <a href="${getShopifyLink(product.handle)}" target="_blank" class="shopify-button">🛒 Buy on Shopify</a>
                </div>
            </div>
        `}).join('');
    }
    
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${filteredProducts.length} cards)`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

function displayInventory(products) {
    const inventoryGrid = document.getElementById('inventory-grid');
    
    if (!products || products.length === 0) {
        inventoryGrid.innerHTML = '<div class="card-placeholder"><div class="card-image">📦</div><p class="coming-soon">No products found</p></div>';
        return;
    }
    
    allProducts = products;
    filteredProducts = products;
    currentPage = 1;
    
    displayInventoryPage();
    initControls();
}
        const variant = product.variants[0];
        const image = product.images[0] ? product.images[0].src : '';
        
        return `
        <div class="card-item">
            <div class="card-image">
                ${image ? `<img src="${image}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='🃏'">` : '🃏'}
            </div>
            <div class="card-info">
                <h3>${product.title}</h3>
                <p class="card-team">${product.vendor || ''}</p>
                <p class="card-price">${formatPrice(variant.price)}</p>
                <a href="${getShopifyLink(product.handle)}" target="_blank" class="shopify-button">🛒 Buy on Shopify</a>
            </div>
        </div>
    `}).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadInventory);