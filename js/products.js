// Products + card UI — loads from Supabase when configured, else local fallback

var PRODUCTS = [];
var waitlistCounts = {};
var myWaitlistIds = [];

var FALLBACK_PRODUCTS = [
  { id:"1",  name:"On Cloudmonster 4",        brand:"On",           cat:"running",    price:289, old:null, rating:4.8, reviews:342,  img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",  badge:"new",  feat:true,  dropDate:null },
  { id:"2",  name:"Adidas UltraBoost 24",      brand:"Adidas",       cat:"running",    price:220, old:280,  rating:4.9, reviews:1205, img:"https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80",  badge:"sale", feat:false, dropDate:null },
  { id:"3",  name:"Nike Alphafly Next%",      brand:"Nike",         cat:"running",    price:275, old:null, rating:4.7, reviews:892,  img:"https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80",  badge:"new",  feat:true,  dropDate:null },
  { id:"4",  name:"NB Fresh Foam X 1080v13",  brand:"New Balance",  cat:"running",    price:185, old:null, rating:4.6, reviews:567,  img:"https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"5",  name:"ASICS Gel-Kayano 30",      brand:"ASICS",        cat:"running",    price:195, old:230,  rating:4.5, reviews:423,  img:"https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",  badge:"sale", feat:false, dropDate:null },
  { id:"6",  name:"Nike Air Force 1 '07",      brand:"Nike",         cat:"casual",     price:145, old:null, rating:4.9, reviews:2341, img:"https://images.unsplash.com/photo-1626379637476-f78d1d86b9f3?w=600&q=80",  badge:null,   feat:true,  dropDate:null },
  { id:"7",  name:"Adidas Stan Smith",         brand:"Adidas",       cat:"casual",     price:165, old:null, rating:4.7, reviews:1876, img:"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"8",  name:"NB 550 Heritage",           brand:"New Balance",  cat:"casual",     price:150, old:180,  rating:4.8, reviews:987,  img:"https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=600&q=80",  badge:"sale", feat:true,  dropDate:null },
  { id:"9",  name:"Vans Old Skool LX",         brand:"Vans",         cat:"casual",     price:95,  old:null, rating:4.6, reviews:1543, img:"https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"10", name:"Converse Chuck 70 Hi",      brand:"Converse",     cat:"casual",     price:110, old:null, rating:4.5, reviews:2109, img:"https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"11", name:"Nike LeBron XXI",          brand:"Nike",         cat:"basketball", price:225, old:null, rating:4.8, reviews:654,  img:"https://images.unsplash.com/photo-1552346053-c33aa8b3d665?w=600&q=80",  badge:"new",  feat:true,  dropDate:null },
  { id:"12", name:"Under Armour Curry 11",    brand:"Under Armour", cat:"basketball", price:180, old:null, rating:4.7, reviews:432,  img:"https://images.unsplash.com/photo-1604726923839-606d2f0e0870?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"13", name:"Adidas Harden Vol. 8",      brand:"Adidas",       cat:"basketball", price:165, old:200,  rating:4.6, reviews:321,  img:"https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80",  badge:"sale", feat:false, dropDate:null },
  { id:"14", name:"Nike KD 16",               brand:"Nike",         cat:"basketball", price:195, old:null, rating:4.7, reviews:287,  img:"https://images.unsplash.com/photo-1602596532816-a5a81fd92c84?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"15", name:"Nike Ja 2",                brand:"Nike",         cat:"basketball", price:135, old:null, rating:4.5, reviews:543,  img:"https://images.unsplash.com/photo-1600415503361-ee0a9ec83c86?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"16", name:"Adidas Yeezy Boost 350 V2", brand:"Adidas",       cat:"lifestyle",  price:290, old:null, rating:4.8, reviews:1876, img:"https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&q=80",  badge:"new",  feat:true,  dropDate:null },
  { id:"17", name:"Adidas Forum 84 Low",       brand:"Adidas",       cat:"lifestyle",  price:140, old:null, rating:4.6, reviews:654,  img:"https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"18", name:"Nike Dunk Low Retro",       brand:"Nike",         cat:"lifestyle",  price:125, old:155,  rating:4.9, reviews:3241, img:"https://images.unsplash.com/photo-1615290642941-36b78b588ca0?w=600&q=80",  badge:"sale", feat:true,  dropDate:null },
  { id:"19", name:"New Balance 990v6",        brand:"New Balance",  cat:"lifestyle",  price:215, old:null, rating:4.8, reviews:876,  img:"https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"20", name:"ASICS Gel-1130",           brand:"ASICS",        cat:"lifestyle",  price:140, old:170,  rating:4.7, reviews:543,  img:"https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&q=80",  badge:"sale", feat:false, dropDate:null },
  { id:"21", name:"Jordan Air Jordan 1 Retro OG", brand:"Jordan",    cat:"limited",    price:380, old:null, rating:5.0, reviews:2341, img:"https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&q=80",  badge:"lim",  feat:true,  dropDate:"2026-06-01" },
  { id:"22", name:"Jordan Travis Scott x AJ4", brand:"Jordan",       cat:"limited",    price:450, old:null, rating:4.9, reviews:432,  img:"https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&q=80",  badge:"lim",  feat:false, dropDate:"2026-06-15" },
  { id:"23", name:"Nike x Off-White Dunk Low",  brand:"Nike",         cat:"limited",    price:520, old:null, rating:4.9, reviews:287,  img:"https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&q=80",  badge:"lim",  feat:false, dropDate:"2026-07-01" },
  { id:"24", name:"Nike sacai LDWaffle",      brand:"Nike",         cat:"limited",    price:340, old:null, rating:4.8, reviews:321,  img:"https://images.unsplash.com/photo-1562613521-6b5293e5b0ea?w=600&q=80",  badge:"lim",  feat:false, dropDate:"2026-07-20" },
  { id:"25", name:"Adidas Fear of God Athletics", brand:"Adidas",    cat:"limited",    price:295, old:null, rating:4.7, reviews:198,  img:"https://images.unsplash.com/photo-1617813774819-2b086f744456?w=600&q=80",  badge:"lim",  feat:false, dropDate:"2026-08-05" },
  { id:"26", name:"Saucony Endorphin Pro 4",   brand:"Saucony",      cat:"running",    price:265, old:null, rating:4.7, reviews:234,  img:"https://images.unsplash.com/photo-1563203444-9e9cf1ec050a?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"27", name:"On Cloudmonster",           brand:"On",           cat:"running",    price:210, old:250,  rating:4.6, reviews:456,  img:"https://images.unsplash.com/photo-1632765259214-9afeef8669e2?w=600&q=80",  badge:"sale", feat:false, dropDate:null },
  { id:"28", name:"Adidas Gazelle Indoor",     brand:"Adidas",       cat:"casual",     price:120, old:null, rating:4.8, reviews:1234, img:"https://images.unsplash.com/photo-1514989940723-e8e51d675571?w=600&q=80",  badge:null,   feat:false, dropDate:null },
  { id:"29", name:"Nike Air Max 90",           brand:"Nike",         cat:"casual",     price:155, old:185,  rating:4.7, reviews:2341, img:"https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80",  badge:"sale", feat:false, dropDate:null },
  { id:"30", name:"Adidas Samba OG",           brand:"Adidas",       cat:"casual",     price:120, old:null, rating:4.9, reviews:3456, img:"https://images.unsplash.com/photo-1695552835943-cbee8150addc?w=600&q=80",  badge:null,   feat:true,  dropDate:null }
];

function starHTML(rating) {
  var stars = '';
  for (var i = 1; i <= 5; i++) stars += i <= Math.floor(rating) ? '★' : '☆';
  return stars;
}

function cardHTML(p, delay, opts) {
  opts = opts || {};
  var badge = '';
  if (p.badge === 'new')  badge = '<span class="pc-badge b-new">New</span>';
  if (p.badge === 'sale') badge = '<span class="pc-badge b-sale">Sale</span>';
  if (p.badge === 'lim')  badge = '<span class="pc-badge b-lim">Limited</span>';

  var oldPrice = p.old ? '<span class="pc-old">$' + p.old + '</span>' : '';
  var cat = p.cat.charAt(0).toUpperCase() + p.cat.slice(1);
  var drop = isDropProduct(p);
  var count = waitlistCounts[p.id] || 0;
  var onList = myWaitlistIds.indexOf(p.id) >= 0;

  var dropMeta = drop && opts.showDropMeta
    ? '<div class="pc-drop-meta">📅 Drop ' + formatDropDate(p.dropDate) + ' · <span class="wl-count" data-pid="' + p.id + '">' + count + '</span> on waitlist</div>'
    : '';

  var actions = '';
  if (drop && opts.waitlistMode) {
    actions =
      '<button class="pc-wait ' + (onList ? 'on-list' : '') + '" onclick="toggleDropWaitlist(\'' + p.id + '\', event)">' +
        (onList ? '✓ On Waitlist' : '🔔 Join Drop Waitlist') +
      '</button>' +
      '<button class="pc-add secondary" onclick="addCart(\'' + p.id + '\', event)">Buy if available</button>';
  } else {
    actions = '<button class="pc-add" onclick="addCart(\'' + p.id + '\', event)">Add +</button>';
    if (drop) {
      actions += '<button class="pc-wait compact" onclick="toggleDropWaitlist(\'' + p.id + '\', event)">' + (onList ? '✓ Waitlist' : '🔔 Notify') + '</button>';
    }
  }

  return (
    '<div class="pc' + (drop ? ' pc-drop' : '') + '" style="animation-delay:' + (delay || 0) + 's">' +
      '<div class="pc-img">' + badge +
        '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80\'" />' +
      '</div>' +
      '<div class="pc-body">' +
        '<div class="pc-brand">' + p.brand + '</div>' +
        '<div class="pc-name">'  + p.name  + '</div>' +
        '<div class="pc-cat">'   + cat     + '</div>' +
        dropMeta +
        '<div class="pc-stars">' + starHTML(p.rating) + ' <span>(' + p.reviews + ')</span></div>' +
        '<div class="pc-foot">' +
          '<div><span class="pc-price">$' + p.price + '</span>' + oldPrice + '</div>' +
          '<div class="pc-actions">' + actions + '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function dropCardHTML(p) {
  var onList = myWaitlistIds.indexOf(p.id) >= 0;
  var count = waitlistCounts[p.id] || 0;
  return (
    '<div class="drop-card">' +
      '<div class="drop-card-img"><img src="' + p.img + '" alt="' + p.name + '" /></div>' +
      '<div class="drop-card-body">' +
        '<div class="pc-brand">' + p.brand + '</div>' +
        '<h3>' + p.name + '</h3>' +
        '<div class="drop-date">📅 ' + formatDropDate(p.dropDate) + '</div>' +
        '<div class="drop-wl"><strong class="wl-count" data-pid="' + p.id + '">' + count + '</strong> members waiting</div>' +
        '<div class="drop-price">$' + p.price + '</div>' +
        '<button class="btn-gold" style="width:100%;margin-top:12px" onclick="toggleDropWaitlist(\'' + p.id + '\', event)">' +
          (onList ? '✓ You\'re on the list' : 'Join Drop Waitlist') +
        '</button>' +
      '</div>' +
    '</div>'
  );
}

async function refreshWaitlistState() {
  var user = await getAuthUser();
  if (user && isSupabaseConfigured()) {
    waitlistCounts = await fetchWaitlistCounts();
    myWaitlistIds = await fetchMyWaitlist(user.id);
  }
}

async function toggleDropWaitlist(id, e) {
  if (e) e.stopPropagation();
  requireLoginForCart(async function() {
    var user = await getAuthUser();
    if (!user) return;
    if (!isSupabaseConfigured()) {
      showToast('⚠️ Connect Supabase in js/config.js first');
      return;
    }
    var onList = myWaitlistIds.indexOf(id) >= 0;
    if (onList) {
      await leaveWaitlist(user.id, id);
      myWaitlistIds = myWaitlistIds.filter(function(x) { return x !== id; });
      waitlistCounts[id] = Math.max(0, (waitlistCounts[id] || 1) - 1);
      showToast('Removed from waitlist');
    } else {
      var r = await joinWaitlist(user.id, id);
      if (!r.ok) { showToast('⚠️ ' + (r.msg || 'Could not join')); return; }
      myWaitlistIds.push(id);
      waitlistCounts[id] = (waitlistCounts[id] || 0) + 1;
      showToast('🔔 You\'re on the drop waitlist!');
    }
    updateWaitlistCountsInDOM();
    if (typeof onWaitlistChanged === 'function') onWaitlistChanged();
  });
}

function updateWaitlistCountsInDOM() {
  document.querySelectorAll('.wl-count').forEach(function(el) {
    var pid = el.getAttribute('data-pid');
    if (pid) el.textContent = waitlistCounts[pid] || 0;
  });
}

function getDropProducts() {
  return PRODUCTS.filter(isDropProduct).sort(function(a, b) {
    if (!a.dropDate) return 1;
    if (!b.dropDate) return -1;
    return a.dropDate.localeCompare(b.dropDate);
  });
}

var productsReady = false;
var productsReadyCallbacks = [];

function onProductsReady(cb) {
  if (productsReady) cb();
  else productsReadyCallbacks.push(cb);
}

async function loadProducts() {
  var fromDb = null;
  try {
    fromDb = await fetchProductsFromDb();
  } catch (error) {
    console.warn('Product fetch failed:', error);
    fromDb = null;
  }
  PRODUCTS = fromDb && fromDb.length ? fromDb : FALLBACK_PRODUCTS.slice();
  await refreshWaitlistState();
  productsReady = true;
  productsReadyCallbacks.forEach(function(cb) { cb(); });
  productsReadyCallbacks = [];
}

document.addEventListener('DOMContentLoaded', function() {
  loadProducts();
});
