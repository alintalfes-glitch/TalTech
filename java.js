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
        if (totalSlides === 0) return;
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

        // Scrollspy pentru link activ
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            const bottom = top + section.offsetHeight;
            const scrollPos = window.scrollY;
            const id = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-link[href="#${id}"]`);
            if (correspondingLink && scrollPos >= top && scrollPos < bottom) {
                navLinks.forEach(l => l.classList.remove('active'));
                correspondingLink.classList.add('active');
            }
        });
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
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    hiddenElements.forEach(el => observer.observe(el));

    // Animare contoare pentru statistici
    const statNumbers = document.querySelectorAll('.stat-number[data-counter]');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-counter'), 10);
                const duration = 2000; // 2 secunde
                const startTime = performance.now();
                
                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const value = Math.floor(progress * target);
                    el.textContent = value;
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        el.textContent = target;
                    }
                }
                requestAnimationFrame(updateCounter);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => counterObserver.observe(num));

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

    // Auto-play la fiecare 6 secunde
    let autoPlay = setInterval(nextSlide, 6000);

    // Pauză la hover
    const sliderContainer = document.querySelector('.testimonial-slider');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', () => clearInterval(autoPlay));
        sliderContainer.addEventListener('mouseleave', () => {
            autoPlay = setInterval(nextSlide, 6000);
        });
    }

    // Recalculare la redimensionare
    window.addEventListener('resize', updateSlider);

    // Inițializare poziție slider
    updateSlider();

    // Formular contact (demo - poate fi conectat la Formspree ulterior)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Înlocuiește acest cod cu un fetch către Formspree sau alt serviciu
            // ex: fetch('https://formspree.io/f/yourFormID', { method: 'POST', body: new FormData(contactForm) })
            alert('Mulțumesc pentru mesaj! (Demo) Formularul va fi conectat la un serviciu de email în curând.');
            contactForm.reset();
        });
    }
});