// Database helpers — products, waitlist, orders, contact

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    cat: row.cat,
    price: row.price,
    old: row.old_price,
    rating: parseFloat(row.rating),
    reviews: row.reviews,
    img: row.img,
    badge: row.badge,
    feat: row.feat,
    dropDate: row.drop_date
  };
}

function isDropProduct(p) {
  return p.badge === 'lim' || p.cat === 'limited';
}

async function fetchProductsFromDb() {
  var sb = getSupabase();
  if (!sb) return null;
  var res = await sb.from('products').select('*').order('id');
  if (res.error) {
    console.warn('products fetch:', res.error.message);
    return null;
  }
  return res.data.map(mapProductRow);
}

async function ensureProfile(user, name) {
  var sb = getSupabase();
  if (!sb || !user) return;
  await sb.from('profiles').upsert({
    id: user.id,
    name: name || user.user_metadata?.name || user.email.split('@')[0],
    updated_at: new Date().toISOString()
  });
}

async function fetchProfile(userId) {
  var sb = getSupabase();
  if (!sb) return null;
  var res = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  return res.error ? null : res.data;
}

async function saveShoeSize(userId, size) {
  var sb = getSupabase();
  if (!sb) return { ok: false };
  var res = await sb.from('profiles').update({ shoe_size: size, updated_at: new Date().toISOString() }).eq('id', userId);
  return { ok: !res.error, msg: res.error?.message };
}

async function fetchWaitlistCounts() {
  var sb = getSupabase();
  if (!sb) return {};
  var res = await sb.from('drop_waitlist').select('product_id');
  if (res.error) return {};
  var counts = {};
  res.data.forEach(function(row) {
    counts[row.product_id] = (counts[row.product_id] || 0) + 1;
  });
  return counts;
}

async function fetchMyWaitlist(userId) {
  var sb = getSupabase();
  if (!sb) return [];
  var res = await sb.from('drop_waitlist').select('product_id').eq('user_id', userId);
  return res.error ? [] : res.data.map(function(r) { return r.product_id; });
}

async function joinWaitlist(userId, productId) {
  var sb = getSupabase();
  if (!sb) return { ok: false, msg: 'Supabase not configured' };
  var res = await sb.from('drop_waitlist').insert({ user_id: userId, product_id: productId });
  if (res.error) {
    if (res.error.code === '23505') return { ok: true, already: true };
    return { ok: false, msg: res.error.message };
  }
  return { ok: true };
}

async function leaveWaitlist(userId, productId) {
  var sb = getSupabase();
  if (!sb) return { ok: false };
  var res = await sb.from('drop_waitlist').delete().eq('user_id', userId).eq('product_id', productId);
  return { ok: !res.error };
}

async function saveOrderToDb(userId, payload, items) {
  var sb = getSupabase();
  if (!sb) return { ok: false, msg: 'Supabase not configured' };

  var orderRes = await sb.from('orders').insert({
    user_id: userId,
    order_number: payload.orderNumber,
    subtotal: payload.subtotal,
    shipping_cost: payload.shippingCost,
    total: payload.total,
    delivery_type: payload.deliveryType,
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    address: payload.address,
    city: payload.city,
    pin: payload.pin,
    status: 'confirmed'
  }).select('id, order_number').single();

  if (orderRes.error) return { ok: false, msg: orderRes.error.message };

  var rows = items.map(function(i) {
    return {
      order_id: orderRes.data.id,
      product_id: i.id,
      name: i.name,
      brand: i.brand,
      price: i.price,
      qty: i.qty,
      img: i.img
    };
  });

  var itemsRes = await sb.from('order_items').insert(rows);
  if (itemsRes.error) return { ok: false, msg: itemsRes.error.message };

  return { ok: true, orderNumber: orderRes.data.order_number };
}

async function fetchUserOrders(userId) {
  var sb = getSupabase();
  if (!sb) return [];
  var res = await sb.from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return res.error ? [] : res.data;
}

async function saveContactMessage(data) {
  var sb = getSupabase();
  if (!sb) return { ok: false, msg: 'Supabase not configured' };
  var res = await sb.from('contact_messages').insert({
    name: data.name,
    email: data.email,
    subject: data.subject || '',
    message: data.message
  });
  return { ok: !res.error, msg: res.error?.message };
}

function formatDropDate(iso) {
  if (!iso) return 'TBA';
  var d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
