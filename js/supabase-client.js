// js/supabase-client.js
// Shared Supabase client

var sbClient = null;
var sbReady = false;

function isSupabaseConfigured() {
  return (
    window.OFFCOURT_CONFIG &&
    window.OFFCOURT_CONFIG.supabaseUrl &&
    window.OFFCOURT_CONFIG.supabaseAnonKey
  );
}

function initSupabase() {
  try {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase config missing");
      return null;
    }

    if (
      typeof window.supabase === "undefined" ||
      !window.supabase.createClient
    ) {
      console.warn("Supabase SDK not loaded");
      return null;
    }

    if (!sbClient) {
      sbClient = window.supabase.createClient(
        window.OFFCOURT_CONFIG.supabaseUrl,
        window.OFFCOURT_CONFIG.supabaseAnonKey
      );

      console.log("Supabase initialized");
    }

    sbReady = true;
    return sbClient;

  } catch (err) {
    console.error("Supabase init failed:", err);
    return null;
  }
}

function getSupabase() {
  return sbClient || initSupabase();
}

function showBackendBanner() {
  if (document.getElementById("backend-banner")) return;

  var connected = !!getSupabase();

  var el = document.createElement("div");
  el.id = "backend-banner";

  if (connected) {
    el.className = "backend-banner ok";
    el.textContent = "Connected to Drop Club ✓";
  } else {
    el.className = "backend-banner";
    el.textContent =
      "Supabase unavailable — running in demo mode";
  }

  document.body.appendChild(el);

  if (connected) {
    setTimeout(function () {
      el.classList.add("hide");
    }, 2500);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initSupabase();
  showBackendBanner();
});