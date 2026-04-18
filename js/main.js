// Main JavaScript file for WorkFast/Wonolo

document.addEventListener('DOMContentLoaded', function() {
    console.log('WorkFast loaded successfully');
    
    // Add any interactive features here
    setupNavigation();
    setupButtons();
});

// Setup navigation functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Navigation clicked:', this.textContent);
            // Add your navigation logic here
        });
    });
}

// Setup button click handlers
function setupButtons() {
    const businessBtn = document.querySelector('.btn-dark');
    const workerBtn = document.querySelector('.btn-light');
    
    if (businessBtn) {
        businessBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Business button clicked');
            // Add your business page navigation here
        });
    }
    
    if (workerBtn) {
        workerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Worker button clicked');
            // Add your worker page navigation here
        });
    }
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
