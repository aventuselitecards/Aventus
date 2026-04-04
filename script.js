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

// Load inventory from inventory.js
function loadInventory() {
    const inventoryGrid = document.getElementById('inventory-grid');
    
    // Use the inventory from inventory.js if available
    if (typeof inventory !== 'undefined' && inventory && inventory.length > 0) {
        displayInventory(inventory);
    } else {
        inventoryGrid.innerHTML = `
            <div class="card-placeholder">
                <div class="card-image">📦</div>
                <p class="coming-soon">Check back soon for our inventory!</p>
            </div>
        `;
    }
}

function displayInventory(cards) {
    const inventoryGrid = document.getElementById('inventory-grid');
    
    if (!cards || cards.length === 0) {
        inventoryGrid.innerHTML = `
            <div class="card-placeholder">
                <div class="card-image">📦</div>
                <p class="coming-soon">Inventory loading...</p>
            </div>
        `;
        return;
    }
    
    // Clear and display cards - show up to 20 cards
    inventoryGrid.innerHTML = cards.slice(0, 20).map(card => `
        <div class="card-item">
            <div class="card-image">
                ${card.image ? `<img src="${card.image}" alt="${card.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='🃏'">` : '🃏'}
            </div>
            <div class="card-info">
                <h3>${card.name || 'Sports Card'}</h3>
                <p class="card-team">${card.team || ''} ${card.year || ''}</p>
                ${card.grade ? `<span class="card-grade">${card.grade}</span>` : ''}
                <p class="card-price">$${card.price || '0.00'}</p>
            </div>
        </div>
    `).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadInventory);