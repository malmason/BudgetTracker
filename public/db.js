let db;
let budgetVersion;

const request = indexedDB.open('budgetTracker', budgetVersion || 10);

request.onupgradeneeded = function (e) {

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  db = e.target.result;

  if(db.objectStoreNames.length === 0) {
    db.createObjectStore('transactions', {autoIncrement: true});
  }
  
};

request.onerror = function(e) {
  console.log(`Error with the database: ${e.target.errorCode}`);
};

function checkDatabase() {
  let transaction = db.transaction(['transactions'], 'readwrite');
  const store = transaction.objectStore('transactions');

  const getAll = store.getAll();

  getAll.onsuccess = function () {
    fetch('/api/transaction/bulk', {
      method: 'POST',
      body: JSON.stringify(getAll.result),
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((res) => {
        // If our returned response is not empty
        if (res.length !== 0) {
          // Open another transaction to budgetTracker with the ability to read and write
          transaction = db.transaction(['transactions'], 'readwrite');

          // Assign the current store to a variable
          const currentStore = transaction.objectStore('transactions');

          // Clear existing entries because our bulk add was successful
          currentStore.clear();
          console.log('Clearing store 🧹');
        }
      });
  };
  // clear the cache
  caches.keys().then(function(names) {
    for (let name of names)
      caches.delete(name);
  });
};

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked');
  // Create a transaction on the budgetTracker db with readwrite access
  const transaction = db.transaction(['transactions'], 'readwrite');

  // Access your budgetTracker object store
  const store = transaction.objectStore('transactions');

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);