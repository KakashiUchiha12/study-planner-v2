// Script to clear all caches and service workers
// Run this in the browser console or as a script

console.log('🧹 Starting cache clearing process...')

// Clear all caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('🧹 Found caches:', cacheNames)
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log(`🧹 Deleting cache: ${cacheName}`)
        return caches.delete(cacheName)
      })
    )
  }).then(() => {
    console.log('🧹 All caches cleared successfully')
  }).catch(error => {
    console.error('🧹 Error clearing caches:', error)
  })
} else {
  console.log('🧹 No caches API available')
}

// Unregister service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('🧹 Found service workers:', registrations.length)
    return Promise.all(
      registrations.map(registration => {
        console.log(`🧹 Unregistering service worker: ${registration.scope}`)
        return registration.unregister()
      })
    )
  }).then(() => {
    console.log('🧹 All service workers unregistered successfully')
  }).catch(error => {
    console.error('🧹 Error unregistering service workers:', error)
  })
} else {
  console.log('🧹 No service worker API available')
}

// Clear localStorage
try {
  localStorage.clear()
  console.log('🧹 localStorage cleared')
} catch (error) {
  console.error('🧹 Error clearing localStorage:', error)
}

// Clear sessionStorage
try {
  sessionStorage.clear()
  console.log('🧹 sessionStorage cleared')
} catch (error) {
  console.error('🧹 Error clearing sessionStorage:', error)
}

console.log('🧹 Cache clearing process completed')
