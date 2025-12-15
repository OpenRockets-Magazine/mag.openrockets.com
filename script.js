// Display current date
function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDate = new Date().toLocaleDateString('en-US', options);
    dateElement.textContent = currentDate;
}

// Mobile menu toggle
function initMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Article hover effect
function initArticleHoverEffects() {
    const articles = document.querySelectorAll('.grid-article, .sidebar-article, .opinion-article');
    
    articles.forEach(article => {
        article.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        article.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Sticky header on scroll
function initStickyHeader() {
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
            header.style.transition = 'transform 0.3s ease';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Search functionality (basic placeholder)
function initSearch() {
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = prompt('Enter search term:');
            if (searchTerm) {
                alert(`Searching for: ${searchTerm}\n\nNote: This is a demo. Search functionality would be implemented with backend integration.`);
            }
        });
    }
}

// Load more articles functionality (simulated)
function initLoadMore() {
    // This would typically fetch more articles from an API
    // For demo purposes, we'll just show an alert
    const articleGrid = document.querySelector('.article-grid');
    
    if (articleGrid) {
        // Add a "Load More" button
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.textContent = 'Load More Articles';
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.style.cssText = `
            display: block;
            margin: 30px auto;
            padding: 12px 30px;
            background: #000;
            color: #fff;
            border: none;
            font-family: Georgia, serif;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s ease;
        `;
        
        loadMoreBtn.addEventListener('mouseenter', function() {
            this.style.background = '#333';
        });
        
        loadMoreBtn.addEventListener('mouseleave', function() {
            this.style.background = '#000';
        });
        
        loadMoreBtn.addEventListener('click', function() {
            alert('Loading more articles...\n\nNote: This is a demo. In a real application, this would fetch additional articles from the server.');
        });
        
        articleGrid.parentNode.insertBefore(loadMoreBtn, articleGrid.nextSibling);
    }
}

// Reading progress indicator
function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: #0066cc;
        z-index: 9999;
        transition: width 0.1s ease;
        width: 0%;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// Image lazy loading fallback (for browsers that don't support native lazy loading)
function initLazyLoading() {
    const images = document.querySelectorAll('img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

// Initialize all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    displayCurrentDate();
    initMobileMenu();
    initSmoothScroll();
    initArticleHoverEffects();
    initStickyHeader();
    initSearch();
    initLoadMore();
    initReadingProgress();
    initLazyLoading();
    
    // Log to console
    console.log('OpenRockets Magazine loaded successfully!');
    console.log('This is a Wall Street Journal-inspired frontend demo.');
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // Reset mobile menu on resize
        const nav = document.getElementById('mainNav');
        if (window.innerWidth > 768 && nav) {
            nav.classList.remove('active');
        }
    }, 250);
});
