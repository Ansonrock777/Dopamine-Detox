const CACHE_NAME = "dopamine-detox-v1";
const STATIC_CACHE = "static-cache-v1";
const DATA_CACHE = "data-cache-v1";

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  "/",
  "/dashboard",
  "/habit-tracker",
  "/dashboard/setup-instructions",
  "/reflection-wall",
  "/_next/static/css/app/globals.css",
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/pages/_app.js",
  "/icon-192.png",
  "/icon-512.png",
];

// API routes that should be cached
const API_ROUTES = [
  "/api/habits",
  "/api/websites/blocked",
  "/api/reflection/questions",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[ServiceWorker] Pre-caching offline page");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((thisCacheName) => {
          if (
            thisCacheName !== CACHE_NAME &&
            thisCacheName !== STATIC_CACHE &&
            thisCacheName !== DATA_CACHE
          ) {
            console.log("[ServiceWorker] Removing old cache", thisCacheName);
            return caches.delete(thisCacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle navigation requests with network-first, cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirstStrategy(request).catch(() =>
        caches.match("/").then((response) => response || fetch(request))
      )
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image"
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(networkFirstStrategy(request));
});

// Network-first strategy with cache fallback
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.status === 200) {
      const cacheName = request.url.includes("/api/")
        ? DATA_CACHE
        : STATIC_CACHE;
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log(
      "[ServiceWorker] Network request failed, serving from cache:",
      request.url
    );
    return caches.match(request);
  }
}

// Cache-first strategy with network fallback
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("[ServiceWorker] Failed to fetch from network:", request.url);
    throw error;
  }
}

// Background sync for habit data
self.addEventListener("sync", (event) => {
  console.log("[ServiceWorker] Background sync triggered");

  if (event.tag === "habit-sync") {
    event.waitUntil(syncHabitData());
  }

  if (event.tag === "reflection-sync") {
    event.waitUntil(syncReflectionData());
  }
});

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("[ServiceWorker] Push notification received");

  if (!event.data) {
    console.log("[ServiceWorker] Push event but no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("[ServiceWorker] Push data:", data);

    const options = {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200],
      data: data,
      actions: [],
    };

    // Add actions based on notification type
    if (data.type === "habit_reminder") {
      options.actions = [
        {
          action: "mark_complete",
          title: "✅ Mark Complete",
        },
        {
          action: "snooze",
          title: "⏰ Remind Later",
        },
      ];
    } else if (data.type === "reflection_prompt") {
      options.actions = [
        {
          action: "reflect",
          title: "🤔 Reflect Now",
        },
        {
          action: "dismiss",
          title: "❌ Dismiss",
        },
      ];
    }

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error("[ServiceWorker] Error handling push notification:", error);
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log(
    "[ServiceWorker] Notification click received:",
    event.notification.data
  );

  event.notification.close();

  const data = event.notification.data;
  let url = "/";

  // Handle different notification actions
  if (event.action === "mark_complete" && data.type === "habit_reminder") {
    // Navigate to habit tracker with completed action
    url = "/habit-tracker?complete=" + data.habitId;
  } else if (event.action === "reflect" && data.type === "reflection_prompt") {
    // Navigate to reflection wall
    url = "/reflection-wall?prompt=" + encodeURIComponent(data.body);
  } else if (event.action === "snooze" && data.type === "habit_reminder") {
    // Schedule another notification for later (handled by client)
    url = "/habit-tracker?snooze=" + data.habitId;
  } else if (!event.action) {
    // Default click action based on notification type
    if (data.type === "habit_reminder") {
      url = "/habit-tracker";
    } else if (data.type === "reflection_prompt") {
      url = "/reflection-wall";
    }
  }

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(url.split("?")[0]) && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window if no matching window found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[ServiceWorker] Notification closed:", event.notification.data);

  // Track notification dismissals for analytics
  const data = event.notification.data;
  if (data && data.trackDismissal) {
    // Could send analytics event here
    console.log(
      "[ServiceWorker] Tracking notification dismissal for:",
      data.type
    );
  }
});

// Sync habit data when connection is restored
async function syncHabitData() {
  try {
    // Get pending habit updates from IndexedDB
    const pendingUpdates = await getPendingHabitUpdates();

    for (const update of pendingUpdates) {
      try {
        let endpoint = "/api/habits";
        let method = "POST";
        let body = update.data;

        if (update.action === "toggle") {
          endpoint = `/api/habits/${update.data.habit_id}/toggle`;
          method = "POST";
          body = {
            completion_date: update.data.completion_date,
            completed: update.data.completed,
          };
        } else if (update.action === "create") {
          endpoint = "/api/habits";
          method = "POST";
          body = update.data;
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          // Remove successful update from pending queue
          await removePendingUpdate(update.id);
          console.log(
            "[ServiceWorker] Successfully synced habit operation:",
            update.action
          );
        } else {
          console.log(
            "[ServiceWorker] Failed to sync habit update - HTTP:",
            response.status
          );
          // Increment retry count
          if (update.retry_count < 3) {
            await updateRetryCount(update.id, (update.retry_count || 0) + 1);
          }
        }
      } catch (error) {
        console.log("[ServiceWorker] Failed to sync habit update:", error);
        // Increment retry count
        if (update.retry_count < 3) {
          await updateRetryCount(update.id, (update.retry_count || 0) + 1);
        }
      }
    }
  } catch (error) {
    console.log("[ServiceWorker] Background sync failed:", error);
  }
}

// Sync reflection responses when connection is restored
async function syncReflectionData() {
  try {
    const pendingReflections = await getPendingReflectionUpdates();

    for (const reflection of pendingReflections) {
      try {
        await fetch("/api/reflection/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reflection.data),
        });

        await removePendingReflection(reflection.id);
      } catch (error) {
        console.log("[ServiceWorker] Failed to sync reflection:", error);
      }
    }
  } catch (error) {
    console.log("[ServiceWorker] Reflection sync failed:", error);
  }
}

// IndexedDB helpers for offline data storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("DopamineDetoxDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("pendingHabits")) {
        const habitStore = db.createObjectStore("pendingHabits", {
          keyPath: "id",
          autoIncrement: true,
        });
        habitStore.createIndex("timestamp", "timestamp");
      }

      if (!db.objectStoreNames.contains("pendingReflections")) {
        const reflectionStore = db.createObjectStore("pendingReflections", {
          keyPath: "id",
          autoIncrement: true,
        });
        reflectionStore.createIndex("timestamp", "timestamp");
      }
    };
  });
}

async function getPendingHabitUpdates() {
  const db = await openDB();
  const transaction = db.transaction(["pendingHabits"], "readonly");
  const store = transaction.objectStore("pendingHabits");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPendingReflectionUpdates() {
  const db = await openDB();
  const transaction = db.transaction(["pendingReflections"], "readonly");
  const store = transaction.objectStore("pendingReflections");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingUpdate(id) {
  const db = await openDB();
  const transaction = db.transaction(["pendingHabits"], "readwrite");
  const store = transaction.objectStore("pendingHabits");

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function removePendingReflection(id) {
  const db = await openDB();
  const transaction = db.transaction(["pendingReflections"], "readwrite");
  const store = transaction.objectStore("pendingReflections");

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function updateRetryCount(id, retryCount) {
  const db = await openDB();
  const transaction = db.transaction(["pendingHabits"], "readwrite");
  const store = transaction.objectStore("pendingHabits");

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        record.retry_count = retryCount;
        const putRequest = store.put(record);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      } else {
        resolve(); // Record doesn't exist anymore
      }
    };
  });
}
