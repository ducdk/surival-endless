document.addEventListener('DOMContentLoaded', function() {
  // Handle fixed header on scroll
  const header = document.querySelector('.landing-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // Mobile menu toggle
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const body = document.body;
  
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      // Toggle mobile menu
      mobileMenu.classList.toggle('open');
      
      // Add animation to hamburger icon
      this.classList.toggle('active');
      
      // Toggle scroll on body
      body.classList.toggle('menu-open');
      
      // Toggle aria-expanded for accessibility
      const expanded = this.getAttribute('aria-expanded') === 'true' || false;
      this.setAttribute('aria-expanded', !expanded);
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
      if (
        mobileMenu.classList.contains('open') && 
        !mobileMenu.contains(e.target) && 
        !hamburger.contains(e.target)
      ) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        body.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768 && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        body.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      if (this.getAttribute('href') !== '#') {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          // Account for fixed header
          const headerHeight = document.querySelector('.landing-header').offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Close mobile menu if open
          if (mobileMenu && mobileMenu.classList.contains('open')) {
            mobileMenu.classList.remove('open');
            if (hamburger) {
              hamburger.classList.remove('active');
              hamburger.setAttribute('aria-expanded', 'false');
              body.classList.remove('menu-open');
            }
          }
        }
      }
    });
  });
  
  // Testimonial slider functionality
  const testimonialTrack = document.querySelector('.testimonials-track');
  const testimonialDots = document.querySelectorAll('.testimonial-dot');
  let currentTestimonial = 0;
  
  if (testimonialTrack && testimonialDots.length > 0) {
    // Initialize dots
    testimonialDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToTestimonial(index);
      });
    });
    
    // Auto-advance testimonials
    setInterval(() => {
      currentTestimonial = (currentTestimonial + 1) % testimonialDots.length;
      goToTestimonial(currentTestimonial);
    }, 5000);
    
    function goToTestimonial(index) {
      // Update track position
      testimonialTrack.style.transform = `translateX(-${index * 100}%)`;
      
      // Update active dot
      testimonialDots.forEach(dot => dot.classList.remove('active'));
      testimonialDots[index].classList.add('active');
      
      // Update current index
      currentTestimonial = index;
    }
  }
  
  // Video play functionality
  const videoPlayButton = document.querySelector('.play-button');
  if (videoPlayButton) {
    videoPlayButton.addEventListener('click', function() {
      const videoContainer = this.closest('.gameplay-video');
      const overlay = videoContainer.querySelector('.video-overlay');
      const img = videoContainer.querySelector('img');
      
      if (img) {
        // Create a video element
        const video = document.createElement('video');
        video.setAttribute('controls', '');
        video.setAttribute('autoplay', '');
        video.classList.add('w-full', 'h-full', 'object-cover');
        
        // You can replace this with your actual gameplay video
        // For now we'll use a placeholder
        video.src = '#'; // Replace with actual video path
        
        // Replace the image with the video
        img.replaceWith(video);
        
        // Remove the overlay
        if (overlay) {
          overlay.remove();
        }
      }
    });
  }
  
  // Animation on scroll
  const animatedElements = document.querySelectorAll('.animated');
  
  if ('IntersectionObserver' in window && animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
      observer.observe(element);
    });
  }
  
  // Form submission for newsletter
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      
      if (emailInput && emailInput.value) {
        // You would typically send this to your backend
        alert('Thanks for subscribing! You\'ll receive updates about Endless Survival.');
        emailInput.value = '';
      }
    });
  }
});