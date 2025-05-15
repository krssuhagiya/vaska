/**
 * VASKA Animations Library
 * A simplified version to ensure compatibility
 */

(function() {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize the animation system
    initAnimations();
  });

  // Main initialization function
  function initAnimations() {
    // Apply fade in animations to elements with data-animate attribute
    applyScrollAnimations();
    
    // Apply staggered animations to product cards
    applyStaggeredAnimations();
    
    // Add hover effects
    applyHoverEffects();
    
    // Set up page transitions if needed
    setupPageTransitions();
    
    console.log('VASKA Animations initialized');
  }

  // Apply scroll-triggered animations
  function applyScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if (animatedElements.length === 0) return;
    
    // Simple IntersectionObserver to trigger animations when elements are visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const animation = element.dataset.animate;
          const delay = element.dataset.delay || 0;
          
          // Add animation after specified delay
          setTimeout(() => {
            element.classList.add('animated', animation);
            element.style.opacity = '1';
          }, delay);
          
          // Stop observing after animation is applied
          observer.unobserve(element);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    // Start observing elements
    animatedElements.forEach(element => {
      // Set initial opacity
      element.style.opacity = '0';
      observer.observe(element);
    });
  }

  // Apply staggered animations to collections of elements
  function applyStaggeredAnimations() {
    const productGrids = document.querySelectorAll('.product-grid');
    
    productGrids.forEach(grid => {
      const products = grid.querySelectorAll('.product-card');
      
      products.forEach((product, index) => {
        // Add animation data attributes if not present
        if (!product.hasAttribute('data-animate')) {
          product.setAttribute('data-animate', 'fadeInUp');
          product.setAttribute('data-delay', index * 100);
          product.style.opacity = '0';
        }
      });
    });
    
    // Trigger a refresh of scroll animations
    applyScrollAnimations();
  }

  // Apply hover effects to elements
  function applyHoverEffects() {
    // For browsers that don't support :hover properly in CSS
    const hoverGrowElements = document.querySelectorAll('.hover-grow');
    const hoverLiftElements = document.querySelectorAll('.hover-lift');
    
    hoverGrowElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.classList.add('hover-grow-active');
      });
      
      element.addEventListener('mouseleave', () => {
        element.classList.remove('hover-grow-active');
      });
    });
    
    hoverLiftElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.classList.add('hover-lift-active');
      });
      
      element.addEventListener('mouseleave', () => {
        element.classList.remove('hover-lift-active');
      });
    });
  }

  // Set up page transitions
  function setupPageTransitions() {
    // Add smooth page loading effect
    document.body.classList.add('page-loaded');
    
    // Animate hero elements if present
    const heroElements = document.querySelectorAll('.hero-element');
    heroElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animated', 'fadeInUp');
      }, 300 + (index * 150));
    });
  }
  
  // Make functions available globally if needed
  window.VASKAAnimations = {
    refresh: initAnimations,
    scrollAnimations: applyScrollAnimations,
    staggeredAnimations: applyStaggeredAnimations
  };
})(); 