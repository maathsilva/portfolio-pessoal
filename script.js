document.addEventListener('DOMContentLoaded', () => {

    try {
        feather.replace();
    } catch (e) {
        console.error('Erro ao inicializar Feather Icons:', e);
    }

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    const typedOptions = {
        strings: [
            "Matheus Silva",
            "Especialista em IA",
            "Analista de Dados",
            "Engenheiro de Software",
            "Engenheiro de Machine Learning",
            "Desenvolvedor Python"
        ],
        typeSpeed: 70,
        backSpeed: 40,
        backDelay: 2000,
        startDelay: 500,
        loop: true,
        showCursor: true,
        cursorChar: '|'
    };

    if (document.getElementById('typed-hero')) {
        new Typed('#typed-hero', typedOptions);
    }

    gsap.registerPlugin(ScrollTrigger);

    // FIX: Removido 'opacity: 0'
    gsap.from(".hero-content .gsap-fade-up", {
        duration: 0.8,
        y: 30,
        ease: 'power2.out',
        delay: 0.2
    });

    const sections = gsap.utils.toArray('.gsap-fade-up');
    
    sections.forEach(section => {
        // FIX: Removido 'opacity: 0'
        gsap.from(section, {
            y: 30,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });

    // FIX: Removido 'opacity: 0'
    gsap.from(".projeto-card", {
        y: 30,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: ".projetos-grid",
            start: "top 80%",
            toggleActions: 'play none none none'
        }
    });

});