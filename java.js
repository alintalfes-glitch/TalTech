// ========== SELECTORI ==========
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollTopBtn = document.getElementById('scroll-top');
    const hiddenElements = document.querySelectorAll('.hidden');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');

    // ========== MENIU HAMBURGER ==========
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
            const expanded = hamburger.getAttribute('aria-expanded') === 'true' ? 'false' : 'true';
            hamburger.setAttribute('aria-expanded', expanded);
        });
    }

    // ========== SMOOTH SCROLL + ÎNCHIDE MENIU ==========
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

    // ========== SCROLL: NAVBAR + BUTON TOP + SCROLLSPY (cu throttling) ==========
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
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

    // ========== SCROLL TO TOP ==========
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ========== ANIMAȚII LA SCROLL (Intersection Observer) ==========
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

    // ========== THEME TOGGLE (LIGHT/DARK) ==========
    if (themeToggle) {
        const savedTheme = localStorage.getItem('taltech-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            if (themeIcon) {
                themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
        };

        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme(prefersDark ? 'dark' : 'light');
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('taltech-theme', newTheme);
        });
    }

    // ========== ÎNCHIDE MENIU LA RESIZE ==========
    window.addEventListener('resize', () => {
        if (window.innerWidth > 767) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
});