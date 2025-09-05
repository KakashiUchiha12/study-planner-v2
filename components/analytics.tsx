"use client"

import { useEffect, useState } from "react"

// Add detailed logging for debugging
console.log('📊 Analytics: Module loading at:', new Date().toISOString());
console.log('📊 Analytics: Import paths:', {
  useEffect: typeof useEffect,
  useState: typeof useState
});

export function Analytics() {
  console.log('📊 Analytics: Component function called at:', new Date().toISOString());
  
  const [isClient, setIsClient] = useState(false)

  console.log('📊 Analytics: State initialized:', { isClient });

  useEffect(() => {
    console.log('📊 Analytics: useEffect triggered at:', new Date().toISOString());
    console.log('📊 Analytics: Starting client-side initialization')
    setIsClient(true)
    
    // Simple analytics tracking without external dependencies
    console.log('📊 Analytics: Page view tracked (mock analytics)')
  }, [])

  console.log('📊 Analytics: Render state:', {
    isClient
  })

  // Return null but provide mock analytics functionality
  console.log('📊 Analytics: Using mock analytics (no external dependencies)')
  return null
}
