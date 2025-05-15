// File path checker for debugging purposes
document.addEventListener('DOMContentLoaded', function() {
  console.log('Checking file paths...');
  
  // Check if animations.css loaded
  const animationStyles = document.querySelector('link[href="/css/animations.css"]');
  console.log('animations.css link found:', !!animationStyles);
  
  // Check if animations.js loaded
  const animationScript = document.querySelector('script[src="/js/animations.js"]');
  console.log('animations.js script found:', !!animationScript);
  
  // Check if specific animations are defined
  try {
    const testElement = document.createElement('div');
    testElement.classList.add('fadeIn');
    const computedStyle = window.getComputedStyle(testElement);
    console.log('fadeIn animation defined:', computedStyle.animationName !== 'none');
  } catch (e) {
    console.error('Error checking animation styles:', e);
  }
  
  // Report resource loading issues
  const failedResources = [];
  document.querySelectorAll('link, script').forEach(resource => {
    if (resource.tagName === 'LINK' && !resource.sheet) {
      failedResources.push(resource.getAttribute('href'));
    }
  });
  
  if (failedResources.length > 0) {
    console.warn('Failed to load resources:', failedResources);
  } else {
    console.log('All resources appear to be loaded correctly');
  }
}); 