import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ClientProviders } from "@/components/client-providers"
import { GlobalNavigationBar } from "@/components/navigation/GlobalNavigationBar"

export const metadata: Metadata = {
  title: "StudyHi - Welcome to Learning",
  description:
    "A comprehensive study platform for students to track subjects, syllabus, test marks, and study sessions.",
  generator: "v0.app",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "StudyHi",
    title: "StudyHi - Welcome to Learning",
    description: "A comprehensive study platform for students to track subjects, syllabus, test marks, and study sessions.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  console.log('🏗️ RootLayout: Rendering layout component');
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Enhanced cache clearing and debugging */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🏗️ RootLayout: Starting application initialization at:', new Date().toISOString());
              console.log('🏗️ RootLayout: User agent:', navigator.userAgent);
              console.log('🏗️ RootLayout: Window location:', window.location.href);
              
              // Aggressively disable service worker to prevent caching issues
              if ('serviceWorker' in navigator) {
                console.log('🚫 Layout: Service worker support detected - aggressively disabling');
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  console.log('🚫 Layout: Found', registrations.length, 'service worker registrations');
                  registrations.forEach(registration => {
                    console.log('🚫 Layout: Unregistering service worker:', registration.scope);
                    registration.unregister().then(success => {
                      console.log('🚫 Layout: Service worker unregistered:', success);
                    });
                  });
                });
                
                // Also try to unregister any service worker that might be registered
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register = function() {
                    console.log('🚫 Layout: Service worker registration blocked');
                    return Promise.reject(new Error('Service worker registration disabled'));
                  };
                }
              } else {
                console.log('🚫 Layout: No service worker support');
              }
              
              // Clear caches
              if ('caches' in window) {
                console.log('🚫 Layout: Cache API support detected');
                caches.keys().then(cacheNames => {
                  console.log('🚫 Layout: Found', cacheNames.length, 'caches');
                  cacheNames.forEach(cacheName => {
                    console.log('🚫 Layout: Deleting cache:', cacheName);
                    caches.delete(cacheName).then(success => {
                      console.log('🚫 Layout: Cache deleted:', cacheName, success);
                    });
                  });
                });
              } else {
                console.log('🚫 Layout: No cache API support');
              }
              
              // Clear localStorage and sessionStorage
              try {
                localStorage.clear();
                sessionStorage.clear();
                console.log('🚫 Layout: Local storage cleared');
              } catch (e) {
                console.log('🚫 Layout: Error clearing storage:', e);
              }
              
              console.log('🏗️ RootLayout: Application initialization completed at:', new Date().toISOString());
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ClientProviders>
          <GlobalNavigationBar />
          <main className="pt-16">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  )
}