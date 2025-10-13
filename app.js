class PortfolioApp {
  constructor() {
    this.currentPage = 'home';
    this.currentTheme = 'theme-forest';
    this.isDarkMode = true; // Default to dark mode
    this.isMobileMenuOpen = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeTheme();
    this.handleInitialRoute();
    this.loadProjects();
    this.updateStats();
    this.initLogoAnimation();
  }

  setupEventListeners() {
    // Brand link (Om Singh as home button)
    const brandLink = document.querySelector('.brand-link');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo('home');
      });
    }

    // Navigation links
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('href').substring(1);
        this.navigateTo(page);
        this.closeMobileMenu();
      });
    });

    // CTA buttons
    document.querySelectorAll('.btn[href^="#"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = btn.getAttribute('href').substring(1);
        this.navigateTo(page);
      });
    });

    // Theme switcher
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        this.switchTheme(theme);
      });
    });

    // Dark mode toggle
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        this.toggleDarkMode();
      });
    }

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      const mobileMenu = document.querySelector('.mobile-menu');
      const mobileToggle = document.querySelector('.mobile-menu-toggle');
      
      if (this.isMobileMenuOpen && 
          !mobileMenu.contains(e.target) && 
          !mobileToggle.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.handleInitialRoute();
    });

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      this.handleInitialRoute();
    });
  }

  navigateTo(page) {
    // Update URL hash
    window.location.hash = page;
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(page);
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // Update navigation state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${page}`) {
        link.classList.add('active');
      }
    });
    
    // Show/hide navbar based on page
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (page === 'home') {
        navbar.classList.add('hidden');
      } else {
        navbar.classList.remove('hidden');
      }
    }
    
    this.currentPage = page;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleInitialRoute() {
    const hash = window.location.hash.substring(1);
    const page = hash || 'home';
    
    // Always navigate on initial route to ensure proper page visibility
    this.navigateTo(page);
  }

  switchTheme(themeName) {
    // Remove current theme
    document.body.classList.remove(this.currentTheme);
    
    // Add new theme
    const themeClass = `theme-${themeName}`;
    document.body.classList.add(themeClass);
    this.currentTheme = themeClass;
    
    // Update theme button states
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-theme') === themeName) {
        btn.classList.add('active');
      }
    });
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    
    if (this.isDarkMode) {
      document.body.setAttribute('data-color-scheme', 'dark');
    } else {
      document.body.setAttribute('data-color-scheme', 'light');
    }
    
    // Update dark mode toggle icon
    const toggle = document.querySelector('.dark-mode-toggle i');
    if (toggle) {
      toggle.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  initializeTheme() {
    // Set default dark mode
    document.body.setAttribute('data-color-scheme', 'dark');
    
    // Set default theme
    document.body.classList.add(this.currentTheme);
    
    // Update theme button state
    const defaultThemeBtn = document.querySelector('[data-theme="forest"]');
    if (defaultThemeBtn) {
      defaultThemeBtn.classList.add('active');
    }
  }

  toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    if (this.isMobileMenuOpen) {
      mobileMenu.classList.add('active');
      mobileMenu.style.display = 'flex';
      mobileToggle.classList.add('active');
    } else {
      mobileMenu.classList.remove('active');
      mobileMenu.style.display = 'none';
      mobileToggle.classList.remove('active');
    }
  }

  closeMobileMenu() {
    if (this.isMobileMenuOpen) {
      const mobileMenu = document.querySelector('.mobile-menu');
      const mobileToggle = document.querySelector('.mobile-menu-toggle');
      
      this.isMobileMenuOpen = false;
      mobileMenu.classList.remove('active');
      mobileMenu.style.display = 'none';
      mobileToggle.classList.remove('active');
    }
  }

  loadProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    const emptyState = document.querySelector('.empty-projects');
    
    if (portfolioData.projects.length === 0) {
      // Show empty state
      if (emptyState) {
        emptyState.style.display = 'flex';
      }
      if (projectsGrid) {
        projectsGrid.style.display = 'none';
      }
    } else {
      // Hide empty state and show projects
      if (emptyState) {
        emptyState.style.display = 'none';
      }
      if (projectsGrid) {
        projectsGrid.style.display = 'grid';
        this.renderProjects();
      }
    }
  }

  renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;
    
    projectsGrid.innerHTML = '';
    
    portfolioData.projects.forEach(project => {
      const projectCard = this.createProjectCard(project);
      projectsGrid.appendChild(projectCard);
    });
  }

  createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const techBadges = project.technologies.map(tech => 
      `<span class="tech-badge">${tech}</span>`
    ).join('');
    
    card.innerHTML = `
      <div class="project-image">
        <img src="${project.image}" alt="${project.title}" onerror="this.parentElement.innerHTML='<i class=\"fas fa-image\" style=\"font-size: 3rem; color: var(--color-text-secondary);\"></i>'">
      </div>
      <div class="project-content">
        <h3 class="project-title">${project.title}</h3>
        <p class="project-description">${project.description}</p>
        <div class="project-tech">
          ${techBadges}
        </div>
        <div class="project-actions">
          ${project.github ? `<a href="${project.github}" target="_blank" class="btn btn--secondary"><i class="fab fa-github"></i> Code</a>` : ''}
          ${project.live ? `<a href="${project.live}" target="_blank" class="btn btn--primary"><i class="fas fa-external-link-alt"></i> Live Demo</a>` : ''}
        </div>
      </div>
    `;
    
    return card;
  }

  updateStats() {
    // Update stats based on current data
    const stats = portfolioData.stats;
    
    // Update age
    const ageElements = document.querySelectorAll('.stat-card .stat-number');
    if (ageElements[0]) {
      ageElements[0].textContent = stats.age;
    }
    
    // Update project count
    if (ageElements[1]) {
      ageElements[1].textContent = stats.projects;
    }
    
    // Update technology count
    if (ageElements[2]) {
      ageElements[2].textContent = stats.technologies;
    }
  }

  // Utility method to add new project (for future use)
  addProject(project) {
    portfolioData.projects.push(project);
    portfolioData.stats.projects = portfolioData.projects.length;
    this.loadProjects();
    this.updateStats();
  }

  // Utility method to update personal info (for future use)
  updatePersonalInfo(info) {
    Object.assign(portfolioData.personal, info);
    // Update UI elements that display personal info
    this.updatePersonalInfoUI();
  }

  updatePersonalInfoUI() {
    // Update name in navigation
    const navBrand = document.querySelector('.nav-brand h2');
    if (navBrand) {
      navBrand.textContent = portfolioData.personal.name;
    }
    
    // Update hero title
    const heroName = document.querySelector('.hero-title .highlight');
    if (heroName) {
      heroName.textContent = portfolioData.personal.name;
    }
    
    // Update profile images
    const profileImages = document.querySelectorAll('img[alt*="Om Singh"]');
    profileImages.forEach(img => {
      img.src = portfolioData.personal.profileImage;
      img.alt = portfolioData.personal.name;
    });
  }

  // Method to get current theme info
  getCurrentTheme() {
    return {
      name: this.currentTheme,
      isDark: this.isDarkMode
    };
  }

  // Animated logo letters
  initLogoAnimation() {
    const letters = document.querySelectorAll('.nav-brand .letter');
    
    if (letters.length === 0) return;

    const animateLetter = (index) => {
      if (index >= letters.length) return;
      
      const letter = letters[index];
      
      // Skip spaces
      if (letter.classList.contains('space')) {
        setTimeout(() => animateLetter(index + 1), 100);
        return;
      }
      
      // Apply 3D rotation on Y-axis - rotate once (360 degrees)
      letter.style.transform = 'rotateY(360deg)';
      
      // Reset to original position after rotation completes
      setTimeout(() => {
        letter.style.transition = 'none'; // Disable transition temporarily
        letter.style.transform = 'rotateY(0deg)';
        
        // Re-enable transition for next animation
        setTimeout(() => {
          letter.style.transition = 'transform 0.8s ease-in-out';
        }, 50);
      }, 800);
      
      // Animate next letter after delay
      setTimeout(() => animateLetter(index + 1), 250);
    };

    // Start the animation sequence
    const startAnimation = () => {
      animateLetter(0);
    };

    // Initial animation after page load
    setTimeout(startAnimation, 1500);

    // Repeat animation every 6 seconds
    setInterval(startAnimation, 6000);
  }
}

// Initialize the portfolio app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.portfolioApp = new PortfolioApp();
});

// Handle smooth scrolling for anchor links
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
});

// Add loading animation
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PortfolioApp;
}