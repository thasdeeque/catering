// ============================================================
// Dashboard App Script
// Handles: navigation, delivery tracking, shop/stock/kitchen
// inventory, and the AI chat mock assistant.
// ============================================================

// Initialize Lucide icons
lucide.createIcons();

// ===== DATA =====
const D = {
  dormetry: { n: 'Dormitory', v: 10, nv: 5, p: [['Adam',1],['Ben',1],['Carl',1],['David',1],['Ethan',1],['Faris',1],['George',1],['Hasan',1],['Ivan',1],['Jack',1],['Kevin',0],['Liam',0],['Noah',0],['Omar',0],['Ryan',0]] },
  lambau: { n: 'Lambau', v: 5, nv: 10, p: [['Alex',1],['Brian',1],['Charles',1],['Daniel',1],['Eric',1],['Felix',0],['Gavin',0],['Henry',0],['Isaac',0],['Jason',0],['Kyle',0],['Lucas',0],['Mason',0],['Nathan',0],['Victor',0]] },
  office: { n: 'Office', v: 10, nv: 30, p: [['Aaron',1],['Adrian',1],['Alan',1],['Albert',1],['Andrew',1],['Anthony',1],['Arthur',1],['Blake',1],['Brandon',1],['Caleb',1],['Cameron',0],['Christian',0],['Colin',0],['Connor',0],['Damian',0],['Derek',0],['Dylan',0],['Edward',0],['Eli',0],['Finn',0],['Frank',0],['Gabriel',0],['Harry',0],['Hugo',0],['Jacob',0],['Joel',0],['Jonathan',0],['Joseph',0],['Julian',0],['Justin',0],['Leo',0],['Logan',0],['Mark',0],['Matthew',0],['Michael',0],['Nicholas',0],['Patrick',0],['Peter',0],['Samuel',0],['Thomas',0]] },
  'guest house': { n: 'Guest House', v: 10, nv: 10, p: [['Aiden',1],['Ashton',1],['Barry',1],['Bruce',1],['Cedric',1],['Dean',1],['Dominic',1],['Edwin',1],['Gordon',1],['Ian',1],['Jeremy',0],['Keith',0],['Louis',0],['Martin',0],['Neil',0],['Philip',0],['Quentin',0],['Scott',0],['Timothy',0],['Warren',0]] }
};

// Stock data (vegetables in kg)
let stockData = {
  tomato: { name: 'Tomato', kg: 10.0, icon: 'apple' },
  potato: { name: 'Potato', kg: 10.0, icon: 'cookie' },
  celery: { name: 'Celery', kg: 10.0, icon: 'leaf' },
  'green-onion': { name: 'Green Onion', kg: 10.0, icon: 'sprout' }
};

// Kitchen items data
let kitchenData = {
  spoon: { name: 'Spoon', total: 50, inStock: 50, inUse: 0, icon: 'utensils' },
  fork: { name: 'Fork', total: 50, inStock: 50, inUse: 0, icon: 'utensils' },
  plates: { name: 'Plates', total: 50, inStock: 50, inUse: 0, icon: 'ellipse' },
  trays: { name: 'Trays', total: 10, inStock: 10, inUse: 0, icon: 'layout-grid' }
};

// Temp values for modals
let tempStockKg = 10.0;
let tempKitchenInUse = 0;
let currentStockKey = null;
let currentKitchenKey = null;
let selectedShoppingItem = null;

const BV = 35, BNV = 55, BT = 90;
let S = {}, CL = null, SP = new Set(), UR = {};
const NI = document.querySelectorAll('.nav-item'), P = document.getElementById('pill'), NB = document.getElementById('navBar'), SC = document.querySelectorAll('.screen'), T = document.getElementById('toast'), CI = document.getElementById('chatInput'), CM = document.getElementById('chatMessages'), SB = document.getElementById('sendBtn'), MS = document.getElementById('mainScroll');

// ===== HOME FUNCTIONS =====
function uH() {
  let dV = 0, dN = 0, UP = [];
  for (const [k, s] of Object.entries(S)) {
    const l = D[k];
    if (s.s === 'c') { dV += l.v; dN += l.nv; }
    else if (s.s === 'p') {
      for (const [n, v] of l.p) if (s.sel && s.sel.includes(n)) { v ? dV++ : dN++; }
      if (s.un) for (const n of s.un) { const p = l.p.find(x => x[0] === n); if (p) UP.push({ n: n, loc: l.n, v: p[1] }); }
    }
  }
  const rV = BV - dV, rN = BNV - dN, rT = rV + rN;
  const vE = document.getElementById('vegCount'), nE = document.getElementById('nonvegCount'), vP = document.getElementById('vegPercent'), nP = document.getElementById('nonvegPercent'), sV = document.getElementById('stackedVeg'), sN = document.getElementById('stackedNonveg'), sB = document.getElementById('statusBadge');
  if (vE) vE.textContent = rV; if (nE) nE.textContent = rN;
  if (rT > 0) { const vp = Math.round(rV / rT * 100), np = Math.round(rN / rT * 100); if (vP) vP.textContent = vp + '%'; if (nP) nP.textContent = np + '%'; if (sV) sV.style.width = vp + '%'; if (sN) sN.style.width = np + '%'; }
  else { if (vP) vP.textContent = '0%'; if (nP) nP.textContent = '0%'; if (sV) sV.style.width = '0%'; if (sN) sN.style.width = '0%'; }
  if (sB) { if (rT === 0) { sB.textContent = 'Complete'; sB.style.background = 'rgba(52,199,89,.15)'; sB.style.color = '#34c759'; } else { sB.textContent = 'On Track'; sB.style.background = 'var(--accent-warm-light)'; sB.style.color = 'var(--accent-warm)'; } }
  const b = document.getElementById('unavailableBanner'), bl = document.getElementById('unavailableBannerList');
  if (UP.length > 0 && b) { b.classList.add('show'); if (bl) bl.innerHTML = UP.map(x => x.n + ' (' + x.loc + ') - ' + (x.v ? 'Veg' : 'Non-Veg')).join('<br>'); }
  else if (b) b.classList.remove('show');
}

function uD() {
  let ac = true, hc = false;
  for (const k of Object.keys(D)) {
    const c = document.getElementById('c-' + k), u = document.getElementById('u-' + k), s = S[k];
    if (!c) continue;
    if (s) { if (s.s === 'c') { c.classList.add('removing'); setTimeout(() => c.style.display = 'none', 500); } else if (s.s === 'p' && s.un && s.un.length > 0) { c.classList.add('unavailable-state'); if (u) { u.style.display = 'flex'; u.querySelector('span').textContent = s.un.join(', ') + (s.un.length > 1 ? ' are not available' : ' is not available'); } hc = true; ac = false; } }
    else { hc = true; ac = false; }
  }
  const e = document.getElementById('deliveryEmpty');
  if (e) e.style.display = (ac && Object.keys(S).length > 0) ? 'flex' : 'none';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ===== DELIVERY MODAL FUNCTIONS =====
function oM(k) {
  if (S[k] && S[k].s === 'c') return;
  CL = k; SP = new Set(); UR = {};
  const ps = S[k]; if (ps && ps.s === 'p' && ps.sel) ps.sel.forEach(n => SP.add(n));
  const d = D[k]; document.getElementById('modalTitle').textContent = d.n; document.getElementById('modalSubtitle').textContent = d.p.length + ' people';
  const l = document.getElementById('modalPeopleList'); l.innerHTML = '';
  const v = d.p.filter(x => x[1]), nv = d.p.filter(x => !x[1]);
  if (v.length) { const h = document.createElement('div'); h.className = 'person-section-header'; h.innerHTML = '<span>Veg</span><div class="person-section-line"></div><span>' + v.length + '</span>'; l.appendChild(h); v.forEach((p, i) => l.appendChild(cR(p, 'v-' + i))); }
  if (nv.length) { const h = document.createElement('div'); h.className = 'person-section-header'; h.innerHTML = '<span>Non-Veg</span><div class="person-section-line"></div><span>' + nv.length + '</span>'; l.appendChild(h); nv.forEach((p, i) => l.appendChild(cR(p, 'nv-' + i))); }
  uSA(); uSC();
  const o = document.getElementById('deliveryModalOverlay'); o.classList.add('active'); document.body.style.overflow = 'hidden';
  if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [o] });
}

function cR(p, id) {
  const r = document.createElement('div'); r.className = 'person-row'; r.dataset.pid = p[0]; r.onclick = () => tP(p[0]);
  const cb = document.createElement('div'); cb.className = 'person-checkbox'; cb.id = 'cb-' + p[0]; cb.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i>'; if (SP.has(p[0])) cb.classList.add('checked');
  const n = document.createElement('div'); n.className = 'person-name'; n.textContent = p[0];
  const b = document.createElement('div'); b.className = 'person-badge ' + (p[1] ? 'veg' : 'nonveg'); b.textContent = p[1] ? 'Veg' : 'Non-Veg';
  r.appendChild(cb); r.appendChild(n); r.appendChild(b); return r;
}

function tP(n) { const cb = document.getElementById('cb-' + n); if (SP.has(n)) { SP.delete(n); cb.classList.remove('checked'); } else { SP.add(n); cb.classList.add('checked'); } uSA(); uSC(); }
function tSA() { const d = D[CL], a = d.p.map(x => x[0]); if (SP.size === a.length) { SP.clear(); a.forEach(n => document.getElementById('cb-' + n).classList.remove('checked')); } else { a.forEach(n => { SP.add(n); document.getElementById('cb-' + n).classList.add('checked'); }); } uSA(); uSC(); }
function uSA() { const d = D[CL], ac = d.p.length, cb = document.getElementById('selectAllCheckbox'), tx = document.getElementById('selectAllText'); if (SP.size === ac && ac > 0) { cb.classList.add('checked'); tx.textContent = 'Deselect All'; } else { cb.classList.remove('checked'); tx.textContent = 'Select All'; } }
function uSC() { const c = SP.size, t = D[CL].p.length; document.getElementById('modalSelectedCount').textContent = c + ' of ' + t + ' selected'; document.getElementById('modalSubmitBtn').disabled = c === 0; }
function cM(e) { if (e && e.target !== e.currentTarget) return; document.getElementById('deliveryModalOverlay').classList.remove('active'); document.body.style.overflow = ''; CL = null; SP = new Set(); }

function sD() {
  const d = D[CL], a = d.p.map(x => x[0]), u = a.filter(n => !SP.has(n));
  if (u.length === 0) { S[CL] = { s: 'c', sel: Array.from(SP), un: [], t: Date.now() }; cM(); showToast('Delivery completed for ' + d.n + '!'); uH(); uD(); }
  else { sUM(u); }
}

function sUM(un) {
  const o = document.getElementById('unselectedModalOverlay'), l = document.getElementById('unselectedPeopleList'), de = document.getElementById('unselectedDesc');
  de.textContent = un.length + ' person' + (un.length > 1 ? 's were' : ' was') + ' not selected.'; l.innerHTML = ''; UR = {};
  un.forEach(n => {
    const r = document.createElement('div'); r.className = 'unselected-person-row';
    const ne = document.createElement('div'); ne.className = 'unselected-person-name'; ne.textContent = n;
    const op = document.createElement('div'); op.className = 'unselected-person-options';
    const b1 = document.createElement('button'); b1.className = 'option-btn'; b1.textContent = 'Not available'; b1.onclick = () => sUR(n, 'na', b1, b2);
    const b2 = document.createElement('button'); b2.className = 'option-btn'; b2.textContent = 'Accident'; b2.onclick = () => sUR(n, 'ac', b2, b1);
    op.appendChild(b1); op.appendChild(b2); r.appendChild(ne); r.appendChild(op); l.appendChild(r);
  });
  o.classList.add('active');
}

function sUR(n, r, sb, ob) { UR[n] = r; sb.classList.add('selected'); ob.classList.remove('selected'); }
function cUM(e) { if (e && e.target !== e.currentTarget) return; document.getElementById('unselectedModalOverlay').classList.remove('active'); }

function cUS() {
  const d = D[CL], a = d.p.map(x => x[0]), u = a.filter(n => !SP.has(n));
  const mr = u.filter(n => !UR[n]); if (mr.length > 0) { showToast('Please select a reason for all unselected people'); return; }
  const un = u.filter(n => UR[n] === 'na'), ac = u.filter(n => UR[n] === 'ac');
  const sel = [...Array.from(SP), ...ac];
  S[CL] = { s: 'c', sel: sel, un: un, t: Date.now() };
  cUM(); cM(); showToast('Delivery updated for ' + d.n + '!'); uH(); uD();
}

// ===== SHOP FUNCTIONS =====
function openShopSub(subId) {
  document.getElementById('shop-main').classList.remove('active');
  const sub = document.getElementById('shop-' + subId);
  if (sub) {
    sub.classList.add('active');
    if (subId === 'stock') renderStockList();
    if (subId === 'kitchen-items') renderKitchenList();
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function backToShop() {
  document.querySelectorAll('.shop-sub-screen').forEach(s => s.classList.remove('active'));
  document.getElementById('shop-main').classList.add('active');
  // Reset shopping
  document.querySelectorAll('.shopping-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('shoppingOtherInput').classList.remove('show');
  document.getElementById('shoppingOtherInput').value = '';
  document.getElementById('shoppingConfirmBtn').disabled = true;
  selectedShoppingItem = null;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- My Shopping - Card Grid ---
function selectShoppingCard(el) {
  document.querySelectorAll('.shopping-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('shoppingOtherInput').classList.remove('show');
  selectedShoppingItem = el.dataset.item;
  document.getElementById('shoppingConfirmBtn').disabled = false;
}

function selectShoppingOtherCard(el) {
  document.querySelectorAll('.shopping-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const input = document.getElementById('shoppingOtherInput');
  input.classList.add('show');
  setTimeout(() => input.focus(), 100);
  selectedShoppingItem = 'Other';
  document.getElementById('shoppingConfirmBtn').disabled = false;
}

function submitShoppingOrder() {
  if (!selectedShoppingItem) return;
  let itemName = selectedShoppingItem;
  if (selectedShoppingItem === 'Other') {
    const val = document.getElementById('shoppingOtherInput').value.trim();
    if (!val) { showToast('Please type what you want to order'); return; }
    itemName = val;
  }
  showToast('Your order of ' + itemName + ' has been placed');
  // Reset
  document.querySelectorAll('.shopping-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('shoppingOtherInput').classList.remove('show');
  document.getElementById('shoppingOtherInput').value = '';
  document.getElementById('shoppingConfirmBtn').disabled = true;
  selectedShoppingItem = null;
}

// --- Stock ---
function renderStockList() {
  const list = document.getElementById('stockList');
  list.innerHTML = '';
  Object.entries(stockData).forEach(([key, item]) => {
    const row = document.createElement('div');
    row.className = 'stock-item';
    row.onclick = () => openStockModal(key);
    row.innerHTML = `
      <div class="stock-item-left">
        <div class="stock-item-icon"><i data-lucide="${item.icon}" style="width:20px;height:20px"></i></div>
        <div class="stock-item-name">${item.name}</div>
      </div>
      <div class="stock-item-kg">${item.kg.toFixed(1)}<span>kg</span></div>
    `;
    list.appendChild(row);
  });
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openStockModal(key) {
  currentStockKey = key;
  const item = stockData[key];
  tempStockKg = item.kg;
  document.getElementById('stockDetailName').textContent = item.name;
  document.getElementById('stockDetailCurrent').textContent = item.kg.toFixed(1) + ' kg';
  document.getElementById('stockDetailIcon').innerHTML = `<i data-lucide="${item.icon}" style="width:28px;height:28px"></i>`;
  document.getElementById('stockAdjustValue').value = item.kg.toFixed(1);
  const overlay = document.getElementById('stockModalOverlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [overlay] });
}

function closeStockModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('stockModalOverlay').classList.remove('active');
  document.body.style.overflow = '';
  currentStockKey = null;
}

function adjustStock(delta) {
  tempStockKg = Math.max(0, tempStockKg + delta);
  document.getElementById('stockAdjustValue').value = tempStockKg.toFixed(1);
}

function validateStockInput() {
  const input = document.getElementById('stockAdjustValue');
  let val = parseFloat(input.value);
  if (isNaN(val) || val < 0) val = 0;
  tempStockKg = val;
  input.value = tempStockKg.toFixed(1);
}

function saveStock() {
  if (currentStockKey) {
    stockData[currentStockKey].kg = tempStockKg;
    showToast(stockData[currentStockKey].name + ' updated to ' + tempStockKg.toFixed(1) + ' kg');
    renderStockList();
    closeStockModal();
  }
}

// --- Kitchen Items - SINGLE ROW ---
function renderKitchenList() {
  const list = document.getElementById('kitchenList');
  list.innerHTML = '';
  Object.entries(kitchenData).forEach(([key, item]) => {
    const row = document.createElement('div');
    row.className = 'kitchen-item';
    row.onclick = () => openKitchenModal(key);
    row.innerHTML = `
      <div class="kitchen-item-left">
        <div class="kitchen-item-icon"><i data-lucide="${item.icon}" style="width:20px;height:20px"></i></div>
        <div class="kitchen-item-name">${item.name}</div>
      </div>
      <div class="kitchen-item-counts">
        <div class="kitchen-count-pill instock">${item.inStock} In</div>
        <div class="kitchen-count-pill inuse">${item.inUse} Out</div>
      </div>
    `;
    list.appendChild(row);
  });
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openKitchenModal(key) {
  currentKitchenKey = key;
  const item = kitchenData[key];
  tempKitchenInUse = item.inUse;
  document.getElementById('kitchenDetailName').textContent = item.name;
  document.getElementById('kitchenDetailTotal').textContent = item.total;
  document.getElementById('kitchenDetailIcon').innerHTML = `<i data-lucide="${item.icon}" style="width:28px;height:28px"></i>`;
  updateKitchenModalDisplay();
  const overlay = document.getElementById('kitchenModalOverlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [overlay] });
}

function closeKitchenModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('kitchenModalOverlay').classList.remove('active');
  document.body.style.overflow = '';
  currentKitchenKey = null;
}

function updateKitchenModalDisplay() {
  const item = kitchenData[currentKitchenKey];
  document.getElementById('kitchenSingleValue').value = tempKitchenInUse;
  // Disable buttons based on limits
  document.getElementById('kitchenOutBtn').disabled = tempKitchenInUse <= 0;
  document.getElementById('kitchenInBtn').disabled = tempKitchenInUse >= item.total;
}

function adjustKitchen(delta) {
  const item = kitchenData[currentKitchenKey];
  tempKitchenInUse = Math.max(0, Math.min(item.total, tempKitchenInUse + delta));
  updateKitchenModalDisplay();
}

function validateKitchenInput() {
  const input = document.getElementById('kitchenSingleValue');
  let val = parseInt(input.value);
  const item = kitchenData[currentKitchenKey];
  if (isNaN(val) || val < 0) val = 0;
  if (val > item.total) val = item.total;
  tempKitchenInUse = val;
  updateKitchenModalDisplay();
}

function saveKitchen() {
  if (currentKitchenKey) {
    kitchenData[currentKitchenKey].inUse = tempKitchenInUse;
    kitchenData[currentKitchenKey].inStock = kitchenData[currentKitchenKey].total - tempKitchenInUse;
    showToast(kitchenData[currentKitchenKey].name + ' updated: ' + kitchenData[currentKitchenKey].inStock + ' In, ' + tempKitchenInUse + ' Out');
    renderKitchenList();
    closeKitchenModal();
  }
}

// ===== NAVIGATION =====
function uPP() {
  const ai = document.querySelector('.nav-item.active');
  if (ai) { const cr = NB.getBoundingClientRect(), ar = ai.getBoundingClientRect(); P.style.left = (ar.left - cr.left) + 'px'; P.style.width = ar.width + 'px'; }
}

function sT(tn) {
  SC.forEach(s => s.classList.remove('active'));
  const t = document.getElementById('screen-' + tn);
  if (t) t.classList.add('active');
  // Reset shop sub-screens when leaving shop
  if (tn !== 'shop') {
    document.querySelectorAll('.shop-sub-screen').forEach(s => s.classList.remove('active'));
    document.getElementById('shop-main').classList.add('active');
  }
  if (tn === 'ai') { setTimeout(() => { MS.scrollTo({ top: MS.scrollHeight, behavior: 'smooth' }); CI.focus(); }, 100); }
  else MS.scrollTo({ top: 0, behavior: 'smooth' });
}

NI.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    if (item.classList.contains('active')) return;
    NI.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    sT(item.getAttribute('data-tab'));
    let st = performance.now();
    function ap(t) { uPP(); if (t - st < 400) requestAnimationFrame(ap); }
    requestAnimationFrame(ap);
  });
});

function showToast(m) {
  T.textContent = m; T.style.opacity = '1'; T.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => { T.style.opacity = '0'; T.style.transform = 'translateX(-50%) translateY(-60px)'; }, 2500);
}

// ===== AI CHAT =====
function gT() { const n = new Date(); return n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function sCB() { setTimeout(() => MS.scrollTo({ top: MS.scrollHeight, behavior: 'smooth' }), 50); }
function aM(tx, s) {
  const r = document.createElement('div'); r.className = 'message-row ' + s;
  const b = document.createElement('div'); b.className = 'message-bubble ' + s;
  b.innerHTML = eH(tx) + '<div class="message-time">' + gT() + '</div>';
  r.appendChild(b); CM.appendChild(r); sCB();
}
function eH(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function sTy() { const r = document.createElement('div'); r.className = 'message-row ai'; r.id = 'typingRow'; const i = document.createElement('div'); i.className = 'typing-indicator'; i.innerHTML = '<span></span><span></span><span></span>'; r.appendChild(i); CM.appendChild(r); sCB(); return r; }
function rTy() { const t = document.getElementById('typingRow'); if (t) t.remove(); }
function gB(i) {
  const l = i.toLowerCase();
  if (l.includes('cook') || l.includes('recipe') || l.includes('make')) return "How about grilled salmon with lemon butter? It's quick, healthy, and pairs beautifully with steamed asparagus.";
  if (l.includes('healthy') || l.includes('diet') || l.includes('light')) return "For a healthy dinner, try a quinoa bowl with roasted chickpeas, avocado, and a lemon-tahini dressing. High protein and full of flavor!";
  if (l.includes('prep') || l.includes('plan') || l.includes('batch')) return "Meal prep idea: Cook a big batch of chicken curry and portion it with brown rice. It stays fresh for 4 days and reheats perfectly.";
  if (l.includes('veg') || l.includes('vegetarian') || l.includes('paneer')) return "Try a paneer tikka masala with garlic naan, or a hearty lentil soup with crusty bread. Both are satisfying and protein-rich!";
  if (l.includes('breakfast') || l.includes('morning')) return "Overnight oats with chia seeds, fresh berries, and a drizzle of honey. Prep it tonight and grab it tomorrow!";
  if (l.includes('lunch') || l.includes('afternoon')) return "A Mediterranean wrap with hummus, grilled veggies, and feta is a perfect light lunch. Add a side of Greek salad!";
  if (l.includes('dinner') || l.includes('evening')) return "For dinner, a slow-cooked beef stew with crusty bread is hard to beat. Or keep it light with a stir-fry and jasmine rice.";
  if (l.includes('dessert') || l.includes('sweet')) return "How about a simple fruit salad with a honey-yogurt drizzle? Or if you're feeling indulgent, a dark chocolate mousse.";
  if (l.includes('spicy') || l.includes('hot')) return "A Thai red curry with prawns hits the spot. Balance the heat with coconut rice and a side of cucumber raita.";
  if (l.includes('quick') || l.includes('fast') || l.includes('easy')) return "A 15-minute stir-fry: toss whatever veggies you have in a hot pan with soy sauce, ginger, and garlic. Serve over rice.";
  return "That's a great question! I'd suggest exploring seasonal ingredients. Is there a specific cuisine or dietary preference you have in mind?";
}
function sM() { const t = CI.value.trim(); if (!t) return; aM(t, 'user'); CI.value = ''; SB.disabled = true; setTimeout(() => { sTy(); setTimeout(() => { rTy(); aM(gB(t), 'ai'); SB.disabled = true; }, 1500 + Math.random() * 800); }, 300); }
function sQM(t) { CI.value = t; SB.disabled = false; sM(); const c = document.getElementById('suggestionChips'); if (c) { c.style.opacity = '0'; c.style.transform = 'translateY(-8px)'; c.style.transition = 'opacity .3s ease,transform .3s ease'; setTimeout(() => c.style.display = 'none', 300); } }
CI.addEventListener('keypress', e => { if (e.key === 'Enter') sM(); });
CI.addEventListener('input', () => { SB.disabled = !CI.value.trim(); });

// ===== INIT =====
window.addEventListener('load', () => {
  uPP(); uH(); uD();
  setTimeout(() => {
    const rV = BV, rN = BNV, rT = rV + rN, vp = rT > 0 ? Math.round(rV / rT * 100) : 0, np = rT > 0 ? Math.round(rN / rT * 100) : 0;
    const sv = document.getElementById('stackedVeg'), sn = document.getElementById('stackedNonveg');
    if (sv) sv.style.width = vp + '%'; if (sn) sn.style.width = np + '%';
    aV('vegCount', 0, rV, 1000); aV('nonvegCount', 0, rN, 1000); aP('vegPercent', vp, 1000); aP('nonvegPercent', np, 1000);
  }, 400);
});
window.addEventListener('resize', uPP);

function aV(id, start, end, dur) {
  const el = document.getElementById(id); if (!el) return;
  const st = performance.now();
  function up(ct) { const elapsed = ct - st, p = Math.min(elapsed / dur, 1), ea = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(start + (end - start) * ea); if (p < 1) requestAnimationFrame(up); }
  requestAnimationFrame(up);
}
function aP(id, ev, dur) {
  const el = document.getElementById(id); if (!el) return;
  const st = performance.now();
  function up(ct) { const elapsed = ct - st, p = Math.min(elapsed / dur, 1), ea = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(ev * ea) + '%'; if (p < 1) requestAnimationFrame(up); }
  requestAnimationFrame(up);
}
