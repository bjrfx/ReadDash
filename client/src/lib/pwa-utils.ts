// Simple service worker registration
export const register = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Check if the app can be installed
export const checkInstallability = (
  setInstallPrompt: (prompt: any) => void
) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    setInstallPrompt(e);
  });
};

// Prompt user to install PWA
export const promptInstall = async (installPrompt: any) => {
  if (!installPrompt) return false;
  
  // Show the install prompt
  installPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await installPrompt;
  
  // Return true if the user accepted the installation
  return outcome === 'accepted';
};
