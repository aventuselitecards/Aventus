// Aventus Elite Cards - Main Script
// This script loads inventory from inventory.js and displays it

console.log('Aventus Elite Cards script loaded');

// Wait for inventory.js to load
function initInventory() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) {
        console.log('Grid not found, retrying...');
        setTimeout(initInventory, 100);
        return;
    }
    
    // Get inventory from global variable
    const cards = window.inventory || [];
    console.log('Found cards:', cards.length);
    
    if (cards.length === 0) {
        grid.innerHTML = '<p class="coming-soon">No cards in inventory. Check back soon!</p>';
        return;
    }
    
    // Display cards
    grid.innerHTML = cards.map(card => {
        const img = card.image || '';
        const name = card.name || 'Unknown';
        const team = card.team || '';
        const price = card.price || '0';
        
        // Link to Shopify search for this card
        const link = `https://aventus-elite-cards.myshopify.com/search?q=${encodeURIComponent(name)}`;
        
        return `
        <div class="card-item">
            <div class="card-image">
                ${img ? `<img src="${img}" alt="${name}">` : '🃏'}
            </div>
            <div class="card-info">
                <h3>${name}</h3>
                <p class="card-team">${team}</p>
                <p class="card-price">$${price}</p>
                <a href="${link}" target="_blank" class="shopify-button">View on Shopify</a>
            </div>
        </div>
        `;
    }).join('');
    
    console.log('Displayed', cards.length, 'cards');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInventory);
} else {
    // DOM already loaded, wait a bit for inventory.js to run
    setTimeout(initInventory, 200);
}