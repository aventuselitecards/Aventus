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

// Load inventory from localStorage if available
function loadInventory() {
    const inventoryGrid = document.getElementById('inventory-grid');
    
    // Check if there's inventory data stored
    const storedInventory = localStorage.getItem('aventus_inventory');
    
    if (storedInventory) {
        try {
            const cards = JSON.parse(storedInventory);
            displayInventory(cards);
        } catch (e) {
            console.error('Error loading inventory:', e);
        }
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
    
    // Clear and display cards
    inventoryGrid.innerHTML = cards.slice(0, 12).map(card => `
        <div class="card-item">
            <div class="card-image">🃏</div>
            <div class="card-info">
                <h3>${card.name || 'Sports Card'}</h3>
                <span class="card-grade">${card.grade || 'N/A'}</span>
                <p class="card-price">$${card.price || '0.00'}</p>
            </div>
        </div>
    `).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadInventory);