// Shopping cart + checkout (saves real orders when Supabase is connected)

var cart = JSON.parse(localStorage.getItem('oc-cart') || '[]');

var CHECKOUT_FORM_HTML =
  '<div class="delivery-pick">' +
    '<label class="del-opt"><input type="radio" name="del-type" value="ship" checked onchange="toggleDelivery()" /> Ship to my address</label>' +
    '<label class="del-opt"><input type="radio" name="del-type" value="campus" onchange="toggleDelivery()" /> 🏫 Campus pickup — Sector 17, Chandigarh (free)</label>' +
  '</div>' +
  '<div class="frow"><div class="fg"><label>First Name</label><input class="fi" id="o-fn" type="text" placeholder="First name" /></div><div class="fg"><label>Last Name</label><input class="fi" id="o-ln" type="text" placeholder="Last name" /></div></div>' +
  '<div class="fg"><label>Email</label><input class="fi" id="o-em" type="email" placeholder="your@email.com" /></div>' +
  '<div id="ship-fields">' +
    '<div class="fg"><label>Address</label><input class="fi" id="o-ad" type="text" placeholder="Street address" /></div>' +
    '<div class="frow"><div class="fg"><label>City</label><input class="fi" id="o-ci" type="text" placeholder="City" /></div><div class="fg"><label>PIN Code</label><input class="fi" id="o-pi" type="text" placeholder="160001" /></div></div>' +
  '</div>' +
  '<p class="checkout-note">Demo checkout — no real payment. Orders save to your Drop Club account when Supabase is connected.</p>' +
  '<button class="btn-gold" style="width:100%;margin-top:8px;padding:14px" onclick="placeOrder()">Place Order →</button>';

function toggleDelivery() {
  var campus = document.querySelector('input[name="del-type"]:checked')?.value === 'campus';
  var ship = document.getElementById('ship-fields');
  if (ship) ship.style.display = campus ? 'none' : 'block';
}

function addCart(id, e) {
  if (e) e.stopPropagation();
  requireLoginForCart(function() {
    var p = PRODUCTS.find(function(x) { return x.id === id; });
    if (!p) return;
    var existing = cart.find(function(i) { return i.id === id; });
    if (existing) existing.qty++;
    else cart.push({ id: p.id, name: p.name, brand: p.brand, price: p.price, img: p.img, qty: 1 });
    saveCart();
    showToast('👟 ' + p.name + ' added to cart!');
  });
}

function delCart(id) {
  cart = cart.filter(function(i) { return i.id !== id; });
  saveCart();
  renderCart();
}

function qChange(id, d) {
  var item = cart.find(function(i) { return i.id === id; });
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) cart = cart.filter(function(i) { return i.id !== id; });
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('oc-cart', JSON.stringify(cart));
  updateBadge();
  renderCart();
}

function updateBadge() {
  var total = cart.reduce(function(sum, i) { return sum + i.qty; }, 0);
  var badge = document.getElementById('cbadge');
  if (!badge) return;
  badge.textContent = total;
  badge.classList.toggle('on', total > 0);
}

function renderCart() {
  var el = document.getElementById('cdr-items');
  var foot = document.getElementById('cdr-foot');
  if (!el) return;

  if (cart.length === 0) {
    el.innerHTML = '<div class="cdr-empty"><div class="ei">👟</div><div>Your cart is empty</div></div>';
    if (foot) foot.style.display = 'none';
    return;
  }

  el.innerHTML = cart.map(function(item) {
    return (
      '<div class="ci">' +
        '<div class="ci-th"><img src="' + item.img + '" alt="' + item.name + '" /></div>' +
        '<div class="ci-info">' +
          '<div class="ci-br">' + item.brand + '</div>' +
          '<div class="ci-nm">' + item.name + '</div>' +
          '<div class="ci-pr">$' + item.price + '</div>' +
          '<div class="qrow">' +
            '<button class="qb" onclick="qChange(\'' + item.id + '\',-1)">−</button>' +
            '<span class="qn">' + item.qty + '</span>' +
            '<button class="qb" onclick="qChange(\'' + item.id + '\',1)">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="ci-del" onclick="delCart(\'' + item.id + '\')">✕ Remove</button>' +
      '</div>'
    );
  }).join('');

  var sub = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var campusLater = false;
  var ship = sub >= 200 ? 0 : 15;
  var tot = sub + ship;

  if (document.getElementById('cdr-sub'))  document.getElementById('cdr-sub').textContent  = '$' + sub;
  if (document.getElementById('cdr-ship')) document.getElementById('cdr-ship').textContent = sub >= 200 ? 'Free' : '$15';
  if (document.getElementById('cdr-tot'))  document.getElementById('cdr-tot').textContent  = '$' + tot;
  if (foot) foot.style.display = 'block';
}

function openCart() {
  document.getElementById('cdr')?.classList.add('on');
  document.getElementById('overlay')?.classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cdr')?.classList.remove('on');
  document.getElementById('overlay')?.classList.remove('on');
  document.body.style.overflow = '';
}

async function openCheckout() {
  closeCart();
  if (!isLoggedIn()) { openAuth(openCheckout); return; }

  var user = getCurrentUser();
  var emailField = document.getElementById('o-em');
  if (user && emailField) emailField.value = user.email;

  var bodyEl = document.getElementById('modal-body');
  if (bodyEl && !bodyEl.querySelector('#o-fn')) bodyEl.innerHTML = CHECKOUT_FORM_HTML;

  var sb = getSupabase();
  if (sb && user) {
    var profile = await fetchProfile(user.id);
    if (profile?.shoe_size) {
      var note = document.querySelector('.checkout-note');
      if (note) note.textContent = 'Saved size: US ' + profile.shoe_size + ' · Demo checkout (no payment).';
    }
  }

  document.getElementById('mbg')?.classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('mbg')?.classList.remove('on');
  document.body.style.overflow = '';
}

async function placeOrder() {
  var fn = document.getElementById('o-fn')?.value.trim();
  var ln = document.getElementById('o-ln')?.value.trim();
  var em = document.getElementById('o-em')?.value.trim();
  var delType = document.querySelector('input[name="del-type"]:checked')?.value || 'ship';
  var ad = document.getElementById('o-ad')?.value.trim();
  var ci = document.getElementById('o-ci')?.value.trim();
  var pi = document.getElementById('o-pi')?.value.trim();

  if (!fn || !em) { showToast('⚠️ Please fill in name and email'); return; }
  if (delType === 'ship' && !ad) { showToast('⚠️ Please enter your shipping address'); return; }

  var sub = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var shipCost = delType === 'campus' ? 0 : (sub >= 200 ? 0 : 15);
  var tot = sub + shipCost;
  var orderId = 'OC-' + Date.now().toString(36).toUpperCase();

  var user = await getAuthUser();
  var savedOnline = false;

  if (user && isSupabaseConfigured() && cart.length) {
    var r = await saveOrderToDb(user.id, {
      orderNumber: orderId,
      subtotal: sub,
      shippingCost: shipCost,
      total: tot,
      deliveryType: delType,
      firstName: fn,
      lastName: ln,
      email: em,
      address: delType === 'campus' ? 'Sector 17 Campus Hub' : ad,
      city: delType === 'campus' ? 'Chandigarh' : ci,
      pin: pi
    }, cart);
    savedOnline = r.ok;
    if (!r.ok) showToast('⚠️ Order saved locally only: ' + (r.msg || ''));
  }

  var pickupNote = delType === 'campus'
    ? '<br/><strong>Pick up at Sector 17</strong> — we\'ll email when ready.'
    : '';

  document.getElementById('modal-title').textContent = 'Order Placed!';
  document.getElementById('modal-body').innerHTML =
    '<div class="ok-sc">' +
      '<div class="ok-ic">🎉</div>' +
      '<div class="ok-ttl">You\'re all set!</div>' +
      '<div class="ok-id">' + orderId + '</div>' +
      '<div class="ok-msg">Your order is confirmed.' + pickupNote +
        (savedOnline ? '<br/>Saved to <strong>My Orders</strong> in your account.' : '') +
      '</div>' +
      '<button class="btn-gold" style="margin-top:24px;padding:13px 32px" onclick="finishOrder()">Done →</button>' +
    '</div>';

  cart = [];
  saveCart();
}

function finishOrder() {
  closeModal();
  setTimeout(function() {
    var titleEl = document.getElementById('modal-title');
    var bodyEl = document.getElementById('modal-body');
    if (titleEl) titleEl.textContent = 'Checkout';
    if (bodyEl) bodyEl.innerHTML = CHECKOUT_FORM_HTML;
  }, 400);
}

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('on'); }, 2500);
}

document.addEventListener('DOMContentLoaded', function() {
  updateBadge();
  renderCart();
});
