(() => {
    const links = Array.from(document.querySelectorAll('.nav-links a'));

    if (!links.length) {
        return;
    }

    const normalize = (value) => (value || '')
        .split('/')
        .pop()
        .split('?')[0]
        .split('#')[0]
        .toLowerCase();

    const currentPage = normalize(window.location.pathname);

    links.forEach((link, index) => {
        link.style.setProperty('--nav-delay', `${index * 70}ms`);

        if (normalize(link.getAttribute('href')) === currentPage) {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
        }
    });

    const navToggle = document.querySelector('.nav-toggle');
    const dropdowns = Array.from(document.querySelectorAll('.nav-dropdown'));

    const closeDropdowns = (suppressHover = false) => {
        dropdowns.forEach((dropdown) => {
            dropdown.classList.remove('is-open');
            dropdown.classList.toggle('is-closing', suppressHover);
            dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        });
    };

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isOpen = document.body.classList.toggle('nav-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));

            if (!isOpen) {
                closeDropdowns();
            }
        });
    }

    dropdowns.forEach((dropdown) => {
        const toggle = dropdown.querySelector('.dropdown-toggle');

        if (!toggle) {
            return;
        }

        dropdown.addEventListener('mouseenter', () => {
            dropdown.classList.remove('is-closing');
        });

        dropdown.addEventListener('mouseleave', () => {
            dropdown.classList.remove('is-closing');
            dropdown.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        });

        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const wasOpen = dropdown.classList.contains('is-open');

            closeDropdowns();
            dropdown.classList.remove('is-closing');

            if (wasOpen) {
                dropdown.classList.add('is-closing');
                toggle.blur();
                return;
            }

            const isOpen = dropdown.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.nav-dropdown')) {
            closeDropdowns(true);
        }

        if (!event.target.closest('header')) {
            document.body.classList.remove('nav-open');
            navToggle?.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDropdowns();
        }
    });

    const updateScrolledState = () => {
        document.body.classList.toggle('is-scrolled', window.scrollY > 8);
    };

    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });

    window.requestAnimationFrame(() => {
        document.body.classList.add('ui-ready');
    });
})();

(() => {
    const gallery = document.querySelector('[data-gallery]');

    if (!gallery) {
        return;
    }

    const images = [
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.18 PM.jpeg',
            alt: 'Imagen de la vida escolar 1',
            title: 'Vida institucional',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.33 PM.jpeg',
            alt: 'Imagen de la vida escolar 2',
            title: 'Identidad Malvinas',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.34 PM.jpeg',
            alt: 'Imagen de la vida escolar 3',
            title: 'Aulas y talleres',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.56 PM (1).jpeg',
            alt: 'Imagen de la vida escolar 4',
            title: 'Vida institucional',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.56 PM.jpeg',
            alt: 'Imagen de la vida escolar 5',
            title: 'Nuestra escuela',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.57 PM (1).jpeg',
            alt: 'Imagen de la vida escolar 6',
            title: 'Comunidad técnica',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.57 PM (2).jpeg',
            alt: 'Imagen de la vida escolar 7',
            title: 'Aulas y talleres',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.57 PM.jpeg',
            alt: 'Imagen de la vida escolar 8',
            title: 'Proyectos escolares',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.58 PM (1).jpeg',
            alt: 'Imagen de la vida escolar 9',
            title: 'Vida institucional',
        },
        {
            src: 'Assets/WhatsApp Image 2026-08-11 at 7.06.58 PM (2).jpeg',
            alt: 'Imagen de la vida escolar 10',
            title: 'Identidad Malvinas',
        },
    ];

    const frame = gallery.querySelector('[data-gallery-frame]') || gallery.querySelector('.gallery-frame');
    const track = gallery.querySelector('[data-gallery-track]');
    const title = gallery.querySelector('[data-gallery-title]');
    const count = gallery.querySelector('[data-gallery-count]');
    const progress = gallery.querySelector('[data-gallery-progress]');
    const thumbs = Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
    const prev = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');

    if (!frame || !track) {
        return;
    }

    // "activeIndex" es la foto real que se está mostrando (0 a 9, para el
    // contador, el título y las miniaturas). "trackPosition" es la posición
    // dentro de la tira de slides que arma el carrusel, que tiene además una
    // copia de la última foto al principio y una copia de la primera al
    // final: así, al llegar a la foto 1 siempre se ve asomando la foto 10 a
    // la izquierda (y viceversa), sin cortes.
    let activeIndex = 0;
    let trackPosition = 1;
    let slideWidthPx = 0;
    let isAnimating = false;
    let animationTimer = null;

    // Debe coincidir con la duración definida en el CSS para
    // ".gallery-track" y ".gallery-slide" (transition: ... 0.55s ...).
    const TRANSITION_MS = 550;

    const extended = [
        images[images.length - 1],
        ...images,
        images[0],
    ];

    const slides = extended.map((item, position) => {
        const slide = document.createElement('div');
        slide.className = 'gallery-slide';
        slide.dataset.position = String(position);

        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt;
        img.loading = position === 1 ? 'eager' : 'lazy';

        slide.appendChild(img);
        track.appendChild(slide);
        return slide;
    });

    const updateSlideWidth = () => {
        const frameWidth = frame.clientWidth || 900;
        slideWidthPx = Math.max(220, Math.min(frameWidth * 0.64, 780));
        frame.style.setProperty('--slide-w', `${slideWidthPx}px`);
    };

    const applyActiveClass = () => {
        slides.forEach((slide, position) => {
            slide.classList.toggle('is-active', position === trackPosition);
        });
    };

    const positionTrack = (animate) => {
        const frameWidth = frame.clientWidth || 900;
        const offset = (frameWidth / 2) - (slideWidthPx / 2) - (trackPosition * slideWidthPx);

        if (!animate) {
            track.style.transition = 'none';
        }

        track.style.transform = `translateX(${offset}px)`;

        if (!animate) {
            // Fuerza el reflow para que el salto sin animación se aplique ya.
            void track.offsetHeight;

            // Recién después de que el navegador pintó ese salto instantáneo
            // restauramos la transición, para el próximo click.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    track.style.transition = '';
                });
            });
        }
    };

    const updateMeta = () => {
        const item = images[activeIndex];
        if (title) title.textContent = item.title;
        if (count) count.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
        if (progress) progress.style.width = `${((activeIndex + 1) / images.length) * 100}%`;

        thumbs.forEach((thumb, index) => {
            thumb.classList.toggle('is-active', index === activeIndex);
            thumb.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
        });
    };

    const render = (animate) => {
        // Al mover el track y cambiar la clase "is-active" al mismo tiempo,
        // la foto que estaba centrada se desliza a un costado y se oscurece,
        // mientras la que asomaba del otro lado pasa al centro y se ilumina.
        applyActiveClass();
        positionTrack(animate);
        updateMeta();
    };

    // Cuando el carrusel llega a una de las copias clonadas (el extremo de
    // la tira), lo reubicamos al instante en la foto real equivalente.
    // Es una función "idempotente": si trackPosition ya no está en un
    // extremo, no hace nada, así que se puede llamar más de una vez sin
    // problema (se usa tanto si llega el evento "transitionend" como si
    // salta el timeout de seguridad).
    const settleBoundaryIfNeeded = () => {
        if (trackPosition !== 0 && trackPosition !== images.length + 1) {
            return;
        }

        const outgoingSlide = slides[trackPosition];
        const newPosition = trackPosition === 0 ? images.length : 1;
        const incomingSlide = slides[newPosition];
        const affected = [outgoingSlide, incomingSlide].filter(Boolean);

        // Apagamos también la transición propia de esas dos fotos
        // (escala/brillo), no solo la del track: si no, la que entra al
        // centro se ve chica y oscura un instante y recién después se
        // agranda e ilumina, generando un "pop" raro.
        affected.forEach((slide) => {
            slide.style.transition = 'none';
        });

        trackPosition = newPosition;
        applyActiveClass();
        positionTrack(false);

        void track.offsetHeight;

        // Reactivamos la transición recién después de que el navegador ya
        // pintó el cambio instantáneo (doble requestAnimationFrame): así
        // evitamos que, por una cuestión de orden de renderizado, el
        // cambio "sin transición" se termine animando igual y la foto
        // vecina parpadee o desaparezca un instante.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                affected.forEach((slide) => {
                    slide.style.transition = '';
                });
            });
        });
    };

    const startNavigation = () => {
        isAnimating = true;

        if (animationTimer) {
            window.clearTimeout(animationTimer);
        }

        // Red de seguridad: si por algún motivo no llegara el evento
        // "transitionend" (clicks muy seguidos, pestaña en segundo plano,
        // una transición interrumpida, etc.), esto igual termina la
        // navegación y corrige la posición si hacía falta. El margen es
        // mínimo (apenas un par de frames) para que, si el evento no
        // dispara, la corrección sea casi instantánea y no se note un
        // "hueco" donde falta la foto vecina.
        animationTimer = window.setTimeout(() => {
            finishAnimation();
        }, TRANSITION_MS + 40);
    };

    const finishAnimation = () => {
        settleBoundaryIfNeeded();
        isAnimating = false;

        if (animationTimer) {
            window.clearTimeout(animationTimer);
            animationTimer = null;
        }
    };

    const goNext = () => {
        if (isAnimating) {
            return;
        }

        startNavigation();
        activeIndex = (activeIndex + 1) % images.length;
        trackPosition += 1;
        render(true);
    };

    const goPrev = () => {
        if (isAnimating) {
            return;
        }

        startNavigation();
        activeIndex = (activeIndex - 1 + images.length) % images.length;
        trackPosition -= 1;
        render(true);
    };

    const goTo = (index) => {
        if (isAnimating) {
            return;
        }

        const targetIndex = ((index % images.length) + images.length) % images.length;

        if (targetIndex === activeIndex) {
            return;
        }

        startNavigation();
        activeIndex = targetIndex;
        trackPosition = activeIndex + 1;
        render(true);
    };

    track.addEventListener('transitionend', (event) => {
        if (event.target !== track || event.propertyName !== 'transform') {
            return;
        }

        finishAnimation();
    });

    prev?.addEventListener('click', goPrev);
    next?.addEventListener('click', goNext);

    thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => {
            goTo(Number(thumb.dataset.galleryThumb));
        });
    });

    document.addEventListener('keydown', (event) => {
        if (!gallery.matches(':hover') && !gallery.contains(document.activeElement)) {
            return;
        }

        if (event.key === 'ArrowLeft') {
            goPrev();
        }

        if (event.key === 'ArrowRight') {
            goNext();
        }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            updateSlideWidth();
            positionTrack(false);
        }, 120);
    });

    updateSlideWidth();
    render(false);
})();

function validarFormulario() {
    const nombre = document.getElementById('nombre');
    const email = document.getElementById('email');
    const mensaje = document.getElementById('mensaje');
    const respuesta = document.getElementById('respuesta');

    if (!nombre || !email || !mensaje || !respuesta) {
        return false;
    }

    respuesta.textContent = `Gracias, ${nombre.value.trim()}. Tu mensaje quedó listo para enviar.`;
    respuesta.classList.add('is-visible');
    return false;
}