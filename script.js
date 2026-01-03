// WhatsApp config — update to your real number
const WA_NUMBER = '2348163035778';
const WA_BASE = `https://wa.me/${WA_NUMBER}`;

// Theme: dark/light with persistence
const root = document.documentElement;
const toggle = document.getElementById('mode-toggle');
(function initTheme(){
  const saved = localStorage.getItem('mnluxe_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldDark = saved ? saved === 'dark' : prefersDark;
  root.classList.toggle('dark', shouldDark);
  if (toggle) toggle.textContent = shouldDark ? '☀️' : '🌙';
})();
if (toggle) {
  toggle.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    localStorage.setItem('mnluxe_theme', isDark ? 'dark' : 'light');
    toggle.textContent = isDark ? '☀️' : '🌙';
  });
}

// Smooth scroll for nav
document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

// Product filter chips
const chips = document.querySelectorAll('.chip');
const products = document.querySelectorAll('.product');
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.dataset.filter;
    products.forEach(p => {
      p.style.display = (cat === 'all' || p.dataset.cat === cat) ? 'block' : 'none';
    });
  });
});

// Cart drawer
const openCartBtn = document.getElementById('open-cart');
const closeCartBtn = document.getElementById('close-cart');
const clearCartBtn = document.getElementById('clear-cart');
const checkoutBtn = document.getElementById('checkout-wa');
const cartDrawer = document.querySelector('.cart-drawer');
const cartItemsEl = document.querySelector('.cart-items');
const cartTotalEl = document.getElementById('cart-total');

let cart = JSON.parse(localStorage.getItem('mnluxe_cart') || '[]');

function saveCart() {
  localStorage.setItem('mnluxe_cart', JSON.stringify(cart));
}
function formatNaira(n) { return n.toLocaleString('en-NG'); }

function renderCart() {
  cartItemsEl.innerHTML = '';
  let total = 0;
  cart.forEach((item, idx) => {
    total += item.price * item.qty;
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="name">${item.name}</span>
      <span class="price">₦${formatNaira(item.price)}</span>
      <span class="qty">
        <button class="btn qty-btn" data-idx="${idx}" data-op="dec">−</button>
        <strong>${item.qty}</strong>
        <button class="btn qty-btn" data-idx="${idx}" data-op="inc">+</button>
        <button class="btn qty-btn" data-idx="${idx}" data-op="del">Remove</button>
      </span>
    `;
    cartItemsEl.appendChild(li);
  });
  cartTotalEl.textContent = formatNaira(total);
  saveCart();
}
renderCart();

function openCart() {
  // Full width on mobile, panel on desktop
  const isMobile = window.innerWidth <= 600;
  cartDrawer.style.width = isMobile ? '100%' : '360px';
  cartDrawer.classList.add('open');
}
function closeCart() { cartDrawer.classList.remove('open'); }

if (openCartBtn) openCartBtn.addEventListener('click', openCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
if (clearCartBtn) clearCartBtn.addEventListener('click', () => { cart = []; renderCart(); });

// Add to order buttons
document.querySelectorAll('.add').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);
    const idx = cart.findIndex(i => i.name === name && i.price === price);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ name, price, qty: 1 });
    renderCart();
    openCart();
  });
});

// Qty controls
cartItemsEl.addEventListener('click', e => {
  const b = e.target.closest('.qty-btn');
  if (!b) return;
  const idx = Number(b.dataset.idx);
  const op = b.dataset.op;
  if (op === 'inc') cart[idx].qty += 1;
  else if (op === 'dec') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
  else if (op === 'del') cart.splice(idx, 1);
  renderCart();
});

// Checkout via WhatsApp
function buildOrderMessage() {
  if (!cart.length) return 'Hello Men’s Luxe, I would like to place an order.';
  const lines = ['Hello Men’s Luxe, I’d like to place this order:'];
  cart.forEach(i => lines.push(`- ${i.name} x${i.qty} (₦${formatNaira(i.price)} each)`));
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  lines.push(`Total: ₦${formatNaira(total)}`);
  return encodeURIComponent(lines.join('\n'));
}
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    const url = `${WA_BASE}?text=${buildOrderMessage()}`;
    window.open(url, '_blank', 'noopener');
  });
}

// Form handling: Netlify submit + WhatsApp deep link
const form = document.getElementById('order-form');
const waDirect = document.getElementById('wa-direct');

function buildWhatsAppMessage({ name, email, product, quantity, notes }) {
  const lines = [
    'Hello Men’s Luxe, I’d like to order:',
    `Product: ${product}`,
    `Quantity: ${quantity}`,
    `Name: ${name}`,
    `Email: ${email}`,
  ];
  if (notes) lines.push(`Notes: ${notes}`);
  return encodeURIComponent(lines.join('\n'));
}

function updateWaDirect() {
  if (!waDirect) return;
  const name = document.getElementById('name').value.trim() || 'Customer';
  const email = document.getElementById('email').value.trim() || '';
  const product = document.getElementById('product').value.trim() || 'General inquiry';
  const quantity = document.getElementById('quantity').value || '1';
  const notes = document.getElementById('message').value.trim() || '';
  const text = buildWhatsAppMessage({ name, email, product, quantity, notes });
  waDirect.href = `${WA_BASE}?text=${text}`;
}

['input','change'].forEach(evt => {
  ['name','email','product','quantity','message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, updateWaDirect);
  });
});
updateWaDirect();

// On submit, allow Netlify to capture, also open WhatsApp with message
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const product = formData.get('product')?.toString().trim();
    const quantity = formData.get('quantity')?.toString().trim() || '1';
    const notes = formData.get('message')?.toString().trim() || '';

    if (!name || !email || !product) {
      alert('Please fill your name, email, and product.');
      return;
    }

    // Submit to Netlify
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams([...formData]).toString()
    })
    .then(() => {
      // WhatsApp deep link
      const text = buildWhatsAppMessage({ name, email, product, quantity, notes });
      const url = `${WA_BASE}?text=${text}`;
      window.open(url, '_blank', 'noopener');
      alert('Request submitted. We’ll contact you shortly.');
      form.reset();
      updateWaDirect();
    })
    .catch(() => {
      alert('There was an issue submitting the form. Please try again or use WhatsApp.');
    });
  });
}
