// Așteptăm încărcarea DOM-ului
document.addEventListener('DOMContentLoaded', function() {
    // Selectori
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollTopBtn = document.getElementById('scroll-top');
    const hiddenElements = document.querySelectorAll('.hidden');
    const testimonialTrack = document.getElementById('testimonial-track');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const slides = document.querySelectorAll('.testimonial-slide');
    let currentSlide = 0;
    const totalSlides = slides.length;

    // Funcție pentru actualizarea slider-ului
    function updateSlider() {
        const slideWidth = slides[0].clientWidth;
        testimonialTrack.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    }

    // Meniu hamburger
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        const expanded = hamburger.getAttribute('aria-expanded') === 'true' ? 'false' : 'true';
        hamburger.setAttribute('aria-expanded', expanded);
    });

    // Smooth scroll la click pe link-uri
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            // Închide meniul mobil
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Navbar scroll effect + buton scroll top
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Intersection Observer pentru animații la scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animație o singură dată
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    hiddenElements.forEach(el => observer.observe(el));

    // Slider testimoniale
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
    }

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Auto-play la fiecare 5 secunde
    let autoPlay = setInterval(nextSlide, 5000);

    // Pauză la hover
    const sliderContainer = document.querySelector('.testimonial-slider');
    sliderContainer.addEventListener('mouseenter', () => clearInterval(autoPlay));
    sliderContainer.addEventListener('mouseleave', () => {
        autoPlay = setInterval(nextSlide, 5000);
    });

    // Recalculare la redimensionare
    window.addEventListener('resize', updateSlider);

    // Inițializare poziție slider
    updateSlider();
});