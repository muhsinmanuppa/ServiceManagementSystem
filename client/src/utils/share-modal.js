/**
 * Social sharing functionality
 */

// Wait until DOM is fully loaded before executing
(function() {
  function initShareFunctionality() {
    // Only initialize if share buttons exist on the page
    const shareButton = document.querySelector('.share-button');
    
    if (shareButton) {
      shareButton.addEventListener('click', function() {
        // Check if Web Share API is supported
        if (navigator.share) {
          const shareData = {
            title: document.title,
            url: window.location.href
          };
          
          navigator.share(shareData)
            .catch(err => console.error('Error sharing:', err));
        } else {
          // Fallback for browsers that don't support Web Share API
          const shareModal = document.querySelector('.share-modal');
          if (shareModal) shareModal.classList.toggle('show');
        }
      });
    }
    
    // Close share modal when clicking outside
    const shareModal = document.querySelector('.share-modal');
    const shareButtonEl = document.querySelector('.share-button');
    
    if (shareModal && shareButtonEl) {
      document.addEventListener('click', function(event) {
        if (!shareModal.contains(event.target) && !shareButtonEl.contains(event.target)) {
          shareModal.classList.remove('show');
        }
      });
    }
  }
  
  // If DOM is already loaded, init immediately, otherwise wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShareFunctionality);
  } else {
    initShareFunctionality();
  }
})();
