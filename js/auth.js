// Auth — Supabase (real accounts) with local demo fallback

var currentAuthUser = null;

async function getAuthUser() {
  if (currentAuthUser) return currentAuthUser;
  var sb = getSupabase();
  if (!sb) return null;
  var res = await sb.auth.getUser();
  return res.data?.user || null;
}

function isLoggedIn() {
  return !!currentAuthUser;
}

function getCurrentUser() {
  if (!currentAuthUser) return null;
  return {
    id: currentAuthUser.id,
    email: currentAuthUser.email,
    name: currentAuthUser.user_metadata?.name || currentAuthUser.email.split('@')[0]
  };
}

function renderAuthNav() {
  var slot = document.getElementById('nav-auth-slot');
  if (!slot) return;
  var user = getCurrentUser();
  var prefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';

  if (user) {
    var initials = user.name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
    slot.innerHTML =
      '<div class="user-drop-wrap">' +
        '<div class="nav-avatar" id="nav-av" onclick="toggleUserDrop()">' + initials + '</div>' +
        '<div class="user-drop" id="user-drop">' +
          '<div class="user-drop-name">'  + user.name  + '</div>' +
          '<div class="user-drop-email">' + user.email + '</div>' +
          '<hr class="user-drop-hr" />' +
          '<a class="user-drop-link" href="' + prefix + 'drops.html">Drop Radar</a>' +
          '<a class="user-drop-link" href="' + prefix + 'orders.html">My Orders</a>' +
          '<button class="user-drop-btn" onclick="logoutUser()">Sign Out</button>' +
        '</div>' +
      '</div>';
  } else {
    slot.innerHTML = '<button class="btn-signin" onclick="openAuth()">👤 Join Club</button>';
  }
}

function toggleUserDrop() {
  var d = document.getElementById('user-drop');
  if (d) d.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  var av = document.getElementById('nav-av');
  var d  = document.getElementById('user-drop');
  if (d && av && !av.contains(e.target) && !d.contains(e.target)) d.classList.remove('open');
});

function buildAuthPopup() {
  if (document.getElementById('auth-overlay')) return;

  document.body.insertAdjacentHTML('beforeend',
    '<div class="auth-overlay" id="auth-overlay">' +
    '<div class="auth-popup">' +
      '<button class="auth-popup-close" onclick="closeAuth()">✕</button>' +
      '<div class="auth-popup-logo">Off<span>Court</span> Drop Club</div>' +
      '<p class="auth-popup-sub">Sign in to join drop waitlists, save orders, and campus pickup.</p>' +
      '<div class="auth-tabs">' +
        '<button class="auth-tab active" id="tab-login" onclick="switchTab(\'login\')">Sign In</button>' +
        '<button class="auth-tab" id="tab-register" onclick="switchTab(\'register\')">Create Account</button>' +
      '</div>' +
      '<div id="panel-login">' +
        '<div class="fg"><label>Email</label><input class="fi" id="li-email" type="email" placeholder="your@email.com" /></div>' +
        '<div class="fg"><label>Password</label><div class="pass-wrap"><input class="fi" id="li-pass" type="password" placeholder="••••••••" /><button class="pass-eye" onclick="toggleEye(\'li-pass\',this)">👁</button></div></div>' +
        '<div class="auth-err" id="li-err"></div>' +
        '<button class="btn-gold" style="width:100%;padding:13px" onclick="doLogin()">Sign In →</button>' +
      '</div>' +
      '<div id="panel-register" style="display:none">' +
        '<div class="fg"><label>Full Name</label><input class="fi" id="rg-name" type="text" placeholder="Alex Jordan" /></div>' +
        '<div class="fg"><label>Email</label><input class="fi" id="rg-email" type="email" placeholder="your@email.com" /></div>' +
        '<div class="fg"><label>US Shoe Size (optional)</label><select class="fi" id="rg-size"><option value="">Select…</option><option>7</option><option>8</option><option>9</option><option>10</option><option>11</option><option>12</option></select></div>' +
        '<div class="fg"><label>Password</label><div class="pass-wrap"><input class="fi" id="rg-pass" type="password" placeholder="Min 6 characters" oninput="showStrength(this.value)" /><button class="pass-eye" onclick="toggleEye(\'rg-pass\',this)">👁</button></div>' +
        '<div class="str-bar"><div class="str-fill" id="str-fill"></div></div><div class="str-lbl" id="str-lbl"></div></div>' +
        '<div class="fg"><label>Confirm Password</label><input class="fi" id="rg-pass2" type="password" placeholder="••••••••" /></div>' +
        '<div class="auth-err" id="rg-err"></div>' +
        '<button class="btn-gold" style="width:100%;padding:13px" onclick="doRegister()">Create Account →</button>' +
      '</div>' +
    '</div></div>'
  );
}

function switchTab(tab) {
  ['login', 'register'].forEach(function(t) {
    var panel = document.getElementById('panel-' + t);
    var tabBtn = document.getElementById('tab-' + t);
    if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
    if (tabBtn) tabBtn.classList.toggle('active', t === tab);
  });
  ['li-err', 'rg-err'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

var _afterLogin = null;

function openAuth(afterLoginCb) {
  buildAuthPopup();
  if (afterLoginCb) _afterLogin = afterLoginCb;
  var ov = document.getElementById('auth-overlay');
  if (ov) {
    ov.classList.add('show');
    document.body.style.overflow = 'hidden';
    switchTab('login');
  }
}

function closeAuth() {
  var ov = document.getElementById('auth-overlay');
  if (ov) { ov.classList.remove('show'); document.body.style.overflow = ''; }
  if (_afterLogin && isLoggedIn()) {
    var cb = _afterLogin;
    _afterLogin = null;
    cb();
  } else {
    _afterLogin = null;
  }
}

document.addEventListener('click', function(e) {
  var ov = document.getElementById('auth-overlay');
  if (ov && e.target === ov) closeAuth();
});

async function doLogin() {
  var email = document.getElementById('li-email').value.trim();
  var pass  = document.getElementById('li-pass').value;
  var errEl = document.getElementById('li-err');
  if (!email || !pass) { errEl.textContent = 'Please fill in both fields.'; return; }

  var sb = getSupabase();
  if (!sb) { errEl.textContent = 'Add Supabase keys in js/config.js (see SETUP.md).'; return; }

  var res = await sb.auth.signInWithPassword({ email: email, password: pass });
  if (res.error) {
    errEl.textContent = res.error.message;
    return;
  }
  currentAuthUser = res.data.user;
  await ensureProfile(res.data.user);
  renderAuthNav();
  closeAuth();
  showToast('👋 Welcome back!');
  await refreshWaitlistState();
}

async function doRegister() {
  var name  = document.getElementById('rg-name').value.trim();
  var email = document.getElementById('rg-email').value.trim();
  var size  = document.getElementById('rg-size').value;
  var pass  = document.getElementById('rg-pass').value;
  var pass2 = document.getElementById('rg-pass2').value;
  var errEl = document.getElementById('rg-err');

  if (!name || !email || !pass || !pass2) { errEl.textContent = 'Please fill in required fields.'; return; }
  if (pass.length < 6) { errEl.textContent = 'Password needs at least 6 characters.'; return; }
  if (pass !== pass2) { errEl.textContent = 'Passwords do not match.'; return; }

  var sb = getSupabase();
  if (!sb) { errEl.textContent = 'Add Supabase keys in js/config.js.'; return; }

  var res = await sb.auth.signUp({
    email: email,
    password: pass,
    options: { data: { name: name, shoe_size: size } }
  });
  if (res.error) { errEl.textContent = res.error.message; return; }

  if (res.data.user && !res.data.session) {
    errEl.textContent = 'Check your email to confirm, then sign in. (Or disable email confirm in Supabase for demos.)';
    return;
  }

  currentAuthUser = res.data.user;
  await ensureProfile(res.data.user, name);
  if (size) await saveShoeSize(res.data.user.id, size);
  renderAuthNav();
  closeAuth();
  showToast('🎉 Welcome to Drop Club, ' + name + '!');
}

async function logoutUser() {
  var sb = getSupabase();
  if (sb) await sb.auth.signOut();
  currentAuthUser = null;
  myWaitlistIds = [];
  var inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? '../index.html' : 'index.html';
}

function toggleEye(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function showStrength(pass) {
  var fill = document.getElementById('str-fill');
  var lbl  = document.getElementById('str-lbl');
  if (!fill || !lbl) return;
  var score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  var labels = ['', 'Weak', 'Okay', 'Good', 'Strong'];
  fill.style.width = (score / 4 * 100) + '%';
  lbl.textContent = pass ? labels[score] : '';
}

function requireLoginForCart(onSuccess) {
  if (isLoggedIn()) onSuccess();
  else {
    showToast('👆 Sign in to use Drop Club features');
    openAuth(onSuccess);
  }
}

async function initAuth() {
  buildAuthPopup();
  var sb = getSupabase();
  if (sb) {
    var res = await sb.auth.getSession();
    currentAuthUser = res.data.session?.user || null;
    sb.auth.onAuthStateChange(function(event, session) {
      currentAuthUser = session?.user || null;
      renderAuthNav();
      if (event === 'SIGNED_IN') refreshWaitlistState();
    });
    await refreshWaitlistState();
  }
  renderAuthNav();
}

document.addEventListener('DOMContentLoaded', function() { initAuth(); });
