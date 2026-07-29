// Firebase Configuration and Authentication Integration
const firebaseConfig = {
  apiKey: "AIzaSyB5Wj0EATq7-k4hXk1f2AKZ7KW0NXocrUU",
  authDomain: "pdf-toolkit-eaa6d.firebaseapp.com",
  projectId: "pdf-toolkit-eaa6d",
  storageBucket: "pdf-toolkit-eaa6d.firebasestorage.app",
  messagingSenderId: "527479592948",
  appId: "1:527479592948:web:b2ec9ecd3cf2ce82834ba1"
};

// Initialize Firebase App
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  console.log('🔥 Firebase initialized successfully for PDF Toolkit!');
}

function initFirebaseAuth() {
  if (typeof firebase === 'undefined') return;

  const auth = firebase.auth();
  const userProfileMenu = document.querySelector('.user-profile-menu');
  const userAvatar = document.getElementById('userAvatar');
  const userNameText = document.getElementById('userNameText');
  const userPlanText = document.getElementById('userPlanText');

  // Monitor Auth State Changes
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      if (userAvatar) {
        if (user.photoURL) {
          userAvatar.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName || 'User'}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
          userAvatar.textContent = (user.displayName || user.email || 'U').substring(0, 2).toUpperCase();
        }
      }
      if (userNameText) userNameText.textContent = user.displayName || user.email.split('@')[0];
      if (userPlanText) userPlanText.textContent = 'Pro Member';
      
      console.log('👤 Firebase User Authenticated:', user.email);
    } else {
      // Guest User
      if (userAvatar) userAvatar.textContent = 'AI';
      if (userNameText) userNameText.textContent = 'Guest User';
      if (userPlanText) userPlanText.textContent = 'Free Plan';
    }
  });

  // Add Sign In / Sign Out click handler on user profile menu
  if (userProfileMenu) {
    userProfileMenu.style.cursor = 'pointer';
    userProfileMenu.setAttribute('title', 'Click to Sign In with Google / Sign Out');
    
    userProfileMenu.addEventListener('click', () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        if (confirm(`Logged in as ${currentUser.displayName || currentUser.email}.\nDo you want to Sign Out?`)) {
          auth.signOut().then(() => {
            if (window.showToast) window.showToast('Signed out successfully.', 'info');
          });
        }
      } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
          .then((result) => {
            if (window.showToast) window.showToast(`Welcome back, ${result.user.displayName || 'User'}!`, 'success');
          })
          .catch((err) => {
            console.warn('Firebase Sign-In Info:', err.message);
            if (err.code !== 'auth/popup-closed-by-user' && window.showToast) {
              window.showToast(`Sign in note: ${err.message}`, 'info');
            }
          });
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initFirebaseAuth);
