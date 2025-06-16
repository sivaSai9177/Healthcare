/**
 * Browser Storage Clearing Script
 * Run this in the browser console to clear all storage
 */

console.log('🧹 Starting complete browser storage cleanup...');

// 1. Clear all cookies
console.log('🍪 Clearing cookies...');
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Also clear cookies with different paths
["/", "/api", "/api/auth", "/auth"].forEach(path => {
  document.cookie.split(";").forEach(function(c) { 
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=${path}`;
    document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=${path};domain=${window.location.hostname}`;
    document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=${path};domain=.${window.location.hostname}`;
  });
});

// 2. Clear localStorage
console.log('💾 Clearing localStorage...');
try {
  localStorage.clear();
} catch (e) {
  console.error('Failed to clear localStorage:', e);
}

// 3. Clear sessionStorage
console.log('📋 Clearing sessionStorage...');
try {
  sessionStorage.clear();
} catch (e) {
  console.error('Failed to clear sessionStorage:', e);
}

// 4. Clear Cache Storage (including explicitBlockList)
console.log('🗄️ Clearing cache storage...');
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      console.log(`  Deleting cache: ${name}`);
      caches.delete(name);
    });
  });
  
  // Also try to clear specific caches
  caches.open('default').then(cache => {
    cache.keys().then(keys => {
      keys.forEach(key => {
        console.log(`  Removing from default cache: ${key.url}`);
        cache.delete(key);
      });
    });
  }).catch(() => {});
}

// 5. Clear IndexedDB
console.log('🗃️ Clearing IndexedDB...');
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      console.log(`  Deleting IndexedDB: ${db.name}`);
      indexedDB.deleteDatabase(db.name);
    });
  }).catch(() => {});
}

// 6. Unregister Service Workers
console.log('👷 Unregistering service workers...');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log(`  Unregistering service worker: ${registration.scope}`);
      registration.unregister();
    });
  });
}

// 7. Clear WebSQL (legacy, but just in case)
console.log('📊 Clearing WebSQL...');
if (window.openDatabase) {
  try {
    const db = window.openDatabase('', '', '', '');
    db.transaction(tx => {
      tx.executeSql("SELECT name FROM sqlite_master WHERE type='table'", [], (tx, result) => {
        for (let i = 0; i < result.rows.length; i++) {
          const tableName = result.rows.item(i).name;
          if (tableName !== '__WebKitDatabaseInfoTable__') {
            tx.executeSql(`DROP TABLE ${tableName}`);
          }
        }
      });
    });
  } catch (e) {
    // WebSQL might not be available
  }
}

console.log('✅ Browser storage cleanup complete!');
console.log('🔄 Please refresh the page (Ctrl/Cmd + Shift + R) for a clean start.');

// Optional: Auto-reload after 2 seconds
setTimeout(() => {
  console.log('🔄 Reloading page...');
  window.location.reload(true);
}, 2000);