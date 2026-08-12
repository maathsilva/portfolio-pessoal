document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(ScrollTrigger);

    // Animação inicial geral (fade in leve)
    gsap.from('body', { opacity: 0, duration: 0.5, ease: 'power1.inOut' });

    // Animação da seção Hero
    gsap.from('.projeto-hero h1, .projeto-hero .projeto-subtitulo', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power2.out',
        delay: 0.3 // Pequeno delay após o fade geral
    });

    // Animação da Imagem de Destaque
    gsap.from('.projeto-imagem-destaque', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '.projeto-imagem-destaque',
            start: 'top 90%',
            toggleActions: 'play none none none'
        }
    });

    // Animação dos elementos dentro de .projeto-descricao
    gsap.utils.toArray('.projeto-descricao h2, .projeto-descricao p, .projeto-descricao .lista-detalhada, .projeto-descricao .galeria-grid, .projeto-descricao .code-block').forEach(element => {
        gsap.from(element, {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 90%', // Ajuste conforme necessário
                toggleActions: 'play none none none'
            }
        });
    });

     // Animação individual das imagens da galeria (se houver galeria)
     gsap.from('.galeria-grid figure', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '.galeria-grid',
            start: 'top 85%',
            toggleActions: 'play none none none'
        }
    });

});