// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    mouse: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        isMoving: false
    },
    isInHero: true,
    preferences: {
        theme: 'dark',
        quietMode: false,
        largeText: false
    }
};


// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    cursorDot: document.getElementById('cursor-dot'),
    stormReveal: document.getElementById('storm-reveal'),
    heroSection: document.getElementById('hero'),
    themeToggle: document.getElementById('theme-toggle'),
    quietToggle: document.getElementById('quiet-toggle'),
    textSizeToggle: document.getElementById('text-size-toggle')
};


// ============================================
// HERO SECTION VISIBILITY TRACKING
// ============================================

// Use Intersection Observer to efficiently track if hero is in view
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        state.isInHero = entry.isIntersecting;
    });
}, { threshold: 0 });

if (elements.heroSection) {
    heroObserver.observe(elements.heroSection);
}


// ============================================
// MOUSE TRACKING
// ============================================

let mouseMoveTimeout;

document.addEventListener('mousemove', (e) => {
    // Update target reveal position for smooth interpolation
    targetRevealX = e.clientX;
    targetRevealY = e.clientY;
    
    // Update cursor dot position
    if (elements.cursorDot) {
        elements.cursorDot.style.left = `${e.clientX}px`;
        elements.cursorDot.style.top = `${e.clientY}px`;
    }

    state.mouse.isMoving = true;

    // Clear timeout and set new one
    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
        state.mouse.isMoving = false;
    }, 100);
}, { passive: true });


// ============================================
// STORM REVEAL ANIMATION
// Subtle, soft spotlight with eased interpolation and radial gradient falloff
// ============================================

let revealX = window.innerWidth / 2;
let revealY = window.innerHeight / 2;
let targetRevealX = window.innerWidth / 2;
let targetRevealY = window.innerHeight / 2;

function updateStormReveal() {
    // Smooth easing interpolation (easeOutQuad)
    const easing = 0.15;
    revealX += (targetRevealX - revealX) * easing;
    revealY += (targetRevealY - revealY) * easing;

    if (!document.body.classList.contains('quiet-mode') && state.isInHero) {
        // Significantly reduced radius for subtle, localized effect (60px)
        const revealRadius = 120;
        elements.stormReveal.style.opacity = '1';
        const maskImage = `radial-gradient(circle ${revealRadius}px at ${revealX}px ${revealY}px, 
                  rgba(0,0,0,0.95) 5%, 
                  rgba(0,0,0,0.6) 40%, 
                  rgba(0,0,0,0) 100%)`;
        elements.stormReveal.style.maskImage = maskImage;
        // elements.stormReveal.style.webkitMaskImage = maskImage;
    } else {
        elements.stormReveal.style.opacity = '0';
    }

    requestAnimationFrame(updateStormReveal);
}

updateStormReveal();



// ============================================
// ACCESSIBILITY CONTROLS
// ============================================

// Theme Toggle
elements.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    elements.themeToggle.classList.toggle('active');
    
    // Update icon
    const icon = elements.themeToggle.querySelector('i');
    icon.className = newTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    
    state.preferences.theme = newTheme;
    savePreferences();
});

// Quiet Mode Toggle
elements.quietToggle.addEventListener('click', () => {
    document.body.classList.toggle('quiet-mode');
    elements.quietToggle.classList.toggle('active');
    
    state.preferences.quietMode = document.body.classList.contains('quiet-mode');
    savePreferences();
});

// Text Size Toggle
elements.textSizeToggle.addEventListener('click', () => {
    document.body.classList.toggle('large-text');
    elements.textSizeToggle.classList.toggle('active');
    
    state.preferences.largeText = document.body.classList.contains('large-text');
    savePreferences();
});


// ============================================
// PREFERENCES MANAGEMENT
// ============================================

function savePreferences() {
    localStorage.setItem('portfolio-preferences', JSON.stringify(state.preferences));
}

function loadPreferences() {
    const saved = localStorage.getItem('portfolio-preferences');
    if (saved) {
        const prefs = JSON.parse(saved);
        
        // Apply theme
        if (prefs.theme) {
            document.documentElement.setAttribute('data-theme', prefs.theme);
            const icon = elements.themeToggle.querySelector('i');
            icon.className = prefs.theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
            if (prefs.theme === 'light') {
                elements.themeToggle.classList.add('active');
            }
        }
        
        // Apply quiet mode
        if (prefs.quietMode) {
            document.body.classList.add('quiet-mode');
            elements.quietToggle.classList.add('active');
        }
        
        // Apply text size
        if (prefs.largeText) {
            document.body.classList.add('large-text');
            elements.textSizeToggle.classList.add('active');
        }
        
        state.preferences = prefs;
    }
}

// Respect prefers-reduced-motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('quiet-mode');
    state.preferences.quietMode = true;
}


// ============================================
// SMOOTH SCROLLING
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


// ============================================
// BLOG MODALS
// ============================================

// Open modal
document.querySelectorAll('[data-modal]').forEach(card => {
    card.addEventListener('click', () => {
        const modalId = card.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});

// Close modal
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Close on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});


// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Load saved preferences
    loadPreferences();
    
    // Start animation loops
    updateStormReveal();
    
    console.log('Portfolio initialized with intention.');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}