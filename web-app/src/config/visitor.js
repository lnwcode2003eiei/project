const KEY = "visitor_name_prefill";

export function saveVisitorName(name) {
  try {
    if (name) sessionStorage.setItem(KEY, name);
    else sessionStorage.removeItem(KEY);
  } catch { /* Browsing can continue when storage is unavailable. */ }
}

export function getVisitorName() {
  try { return sessionStorage.getItem(KEY) || ""; }
  catch { return ""; }
}
