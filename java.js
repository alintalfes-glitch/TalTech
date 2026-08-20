document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollTopBtn = document.getElementById('scroll-top');
    const scrollProgress = document.getElementById('scroll-progress');
    const hiddenElements = document.querySelectorAll('.hidden');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');
    const loader = document.getElementById('loader');
    const customCursor = document.getElementById('custom-cursor');
    const liveChat = document.getElementById('live-chat');
    const faqItems = document.querySelectorAll('.faq-item');
    const testimonialTrack = document.getElementById('testimonial-track');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const slides = document.querySelectorAll('.testimonial-slide');
    const contactForm = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');
    const newsletterBtn = document.getElementById('newsletter-btn');
    const newsletterEmail = document.getElementById('newsletter-email');
    const scheduleBtn = document.getElementById('schedule-btn');
    const thanksOverlay = document.getElementById('thanks-overlay');
    const thanksClose = document.getElementById('thanks-close');
    const langToggle = document.getElementById('lang-toggle');
    const typingText = document.getElementById('typing-text');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const portfolioImages = document.querySelectorAll('.portfolio-image img[data-lightbox]');
    const contrastToggle = document.getElementById('contrast-toggle');

    window.addEventListener('load', () => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
    });

    if (customCursor) {
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = e.clientX + 'px';
            customCursor.style.top = e.clientY + 'px';
        });
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button, .btn, .service-card, .faq-question')) {
                customCursor.classList.add('hover');
            } else {
                customCursor.classList.remove('hover');
            }
        });
    }

    hamburger?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active') ? 'true' : 'false');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
                if (window.scrollY > 300) scrollTopBtn.classList.add('visible'); else scrollTopBtn.classList.remove('visible');

                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrollPercent = (scrollTop / docHeight) * 100;
                if (scrollProgress) scrollProgress.style.width = scrollPercent + '%';

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
                ticking = false;
            });
            ticking = true;
        }
    });

    scrollTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    hiddenElements.forEach(el => observer.observe(el));

    const statNumbers = document.querySelectorAll('.hero-stat .stat-number[data-counter]');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-counter'), 10);
                const duration = 2000;
                const startTime = performance.now();
                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const value = Math.floor(progress * target);
                    el.textContent = value;
                    if (progress < 1) requestAnimationFrame(updateCounter);
                    else el.textContent = target;
                }
                requestAnimationFrame(updateCounter);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    statNumbers.forEach(num => counterObserver.observe(num));

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    };
    const savedTheme = localStorage.getItem('taltech-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) applyTheme(savedTheme);
    else applyTheme(prefersDark ? 'dark' : 'light');
    themeToggle?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('taltech-theme', newTheme);
    });

    contrastToggle?.addEventListener('click', () => {
        document.documentElement.classList.toggle('high-contrast');
        contrastToggle.textContent = document.documentElement.classList.contains('high-contrast') ? '◑' : '◐';
    });

    let currentSlide = 0;
    const totalSlides = slides.length;
    const updateSlider = () => {
        if (totalSlides === 0) return;
        testimonialTrack.style.transform = `translateX(-${currentSlide * slides[0].clientWidth}px)`;
    };
    const nextSlide = () => { currentSlide = (currentSlide + 1) % totalSlides; updateSlider(); };
    const prevSlide = () => { currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; updateSlider(); };
    nextBtn?.addEventListener('click', nextSlide);
    prevBtn?.addEventListener('click', prevSlide);
    let autoPlay = setInterval(nextSlide, 5000);
    const sliderContainer = document.querySelector('.testimonial-slider');
    sliderContainer?.addEventListener('mouseenter', () => clearInterval(autoPlay));
    sliderContainer?.addEventListener('mouseleave', () => { autoPlay = setInterval(nextSlide, 5000); });
    window.addEventListener('resize', updateSlider);
    updateSlider();

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question?.addEventListener('click', () => item.classList.toggle('active'));
    });

    liveChat?.addEventListener('click', () => {
        window.open('https://wa.me/alin.talfes', '_blank', 'noopener');
    });

    if (typingText) {
        const words = ['Aplicații Web', 'Site-uri Moderne', 'Platforme Scalabile', 'Magazine Online'];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        function type() {
            const currentWord = words[wordIndex];
            charIndex = isDeleting ? charIndex - 1 : charIndex + 1;
            typingText.textContent = currentWord.substring(0, charIndex);
            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                setTimeout(type, 1500);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(type, 300);
            } else {
                setTimeout(type, isDeleting ? 50 : 100);
            }
        }
        type();
    }

    portfolioImages.forEach(img => {
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.hidden = false;
            document.body.style.overflow = 'hidden';
        });
    });

    lightboxClose?.addEventListener('click', () => {
        lightbox.hidden = true;
        document.body.style.overflow = '';
    });

    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.hidden = true;
            document.body.style.overflow = '';
        }
    });

    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const honeypot = document.getElementById('honeypot');
        if (honeypot && honeypot.value) return;
        thanksOverlay.hidden = true;
        formSuccess.hidden = false;
        contactForm.reset();
        setTimeout(() => {
            formSuccess.hidden = true;
        }, 5000);
    });

    thanksClose?.addEventListener('click', () => { thanksOverlay.hidden = true; });

    newsletterBtn?.addEventListener('click', () => {
        const email = newsletterEmail.value.trim();
        if (email) {
            alert('Mulțumim pentru abonare! (Demo)');
            newsletterEmail.value = '';
        } else {
            alert('Te rugăm să introduci un email valid.');
        }
    });

    scheduleBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Programarea întâlnirilor va fi disponibilă în curând.');
    });

    const downloadCv = document.getElementById('download-cv');
    downloadCv?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Fișierul CV/Portofoliu va fi disponibil în curând.');
    });

    langToggle?.addEventListener('click', () => {
        alert('Versiunea în limba engleză va fi disponibilă în curând.');
    });

    function trackEvent(category, action, label) {
        if (typeof gtag === 'function') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
    }

    document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
        a.addEventListener('click', () => trackEvent('Contact', 'Click WhatsApp', a.href));
    });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', () => {
            const target = a.getAttribute('href');
            if (target && target !== '#') trackEvent('Navigation', 'Anchor Click', target);
        });
    });

    contactForm?.addEventListener('submit', () => trackEvent('Form', 'Submit', 'Contact Form'));

    window.addEventListener('resize', () => {
        if (window.innerWidth > 767) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
});