// TEST SCRIPT - Simple test
console.log('TEST: Script loaded');
const inventory = [{name: 'TEST CARD', team: 'Test', price: 1.00}];
let allProducts = inventory;
let filteredProducts = allProducts;

alert('TEST: Script working! Found ' + allProducts.length + ' cards');

document.getElementById('inventory-grid').innerHTML = allProducts.map(p => 
    '<div class="card-item"><div class="card-image">🃏</div><div class="card-info"><h3>' + p.name + '</h3><p>' + p.team + '</p><p>$' + p.price + '</p></div></div>'
).join('');