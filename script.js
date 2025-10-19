document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ATIVAR FEATHER ICONS ---
    try {
        feather.replace();
    } catch (e) {
        console.error('Erro ao inicializar Feather Icons:', e);
    }


    // --- 2. LÓGICA DO MENU HAMBURGUER (MOBILE) ---
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Fecha o menu ao clicar em um link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }


    // --- 3. ANIMAÇÕES COM GSAP ---
    // Registra o plugin ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Animação 1: Fade-in da página inteira ao carregar
    gsap.to('html', { duration: 0.5, opacity: 1, ease: 'power1.inOut' });

    // Animação 2: Animação "Hero" da seção Home (staggered)
    const heroTimeline = gsap.timeline({ delay: 0.2 });
    heroTimeline
        // Anima o H1 (que agora é só "Olá, eu sou")
        .from('.gsap-hero-title', { duration: 0.6, opacity: 0, y: 30, ease: 'power2.out' })
        // Anima o subtítulo e botões
        .from('.gsap-hero-subtitle', { duration: 0.5, opacity: 0, y: 20, ease: 'power2.out' }, '-=0.3')
        .from('.gsap-hero-buttons', { duration: 0.5, opacity: 0, y: 20, ease: 'power2.out' }, '-=0.3');

    
    // --- 4. LÓGICA DO TYPED.JS (NOVO) ---
    // Puxa os títulos do seu perfil
    const typedOptions = {
        strings: [
            "Matheus Silva",
            "Analista de Dados",
            "Especialista em IA",
            "Engenheiro de Machine Learning",
            "Desenvolvedor Python"
        ],
        typeSpeed: 70,      // Velocidade de digitação
        backSpeed: 40,      // Velocidade de "apagar"
        backDelay: 2000,    // Tempo de espera antes de apagar
        startDelay: 800,    // Começa 800ms após a página carregar (dá tempo para o H1 aparecer)
        loop: true,
        showCursor: true,
        cursorChar: '|'
    };

    // Inicia a nova instância do Typed
    new Typed('#typed-name', typedOptions);


    // --- 5. ANIMAÇÕES GSAP DE SCROLL (COMO ANTES) ---
    
    // Animação: Fade-in das seções ao rolar a página
    const sectionsToFade = document.querySelectorAll('.gsap-fade-in');

    sectionsToFade.forEach(section => {
        gsap.from(section, {
            opacity: 0,
            y: 50, // Começa 50px abaixo
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: section,
                start: 'top 85%', // Começa quando 85% do topo da viewport atingir a seção
                toggleActions: 'play none none none' // Apenas executa a animação uma vez
            }
        });
    });

    // Animação: Animação dos cards de projeto (staggered)
    gsap.from(".projeto-card", {
        opacity: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.2, // Anima um card a cada 0.2s
        ease: 'power2.out',
        scrollTrigger: {
            trigger: ".projetos-grid",
            start: "top 80%",
            toggleActions: 'play none none none'
        }
    });

});