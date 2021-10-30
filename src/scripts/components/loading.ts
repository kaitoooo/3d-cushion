import { isMobile } from './isMobile';
import { gsap } from 'gsap';

export default class Loading {
    elms: {
        [s: string]: HTMLElement;
    };
    links: NodeListOf<HTMLElement>;
    isMobile: boolean;
    constructor() {
        this.elms = {
            mvTitle: document.querySelector('[data-mv="title"]'),
            mvHeading: document.querySelector('[data-mv="heading"]'),
        };
        this.links = document.querySelectorAll('[data-mv="link"]');
        this.isMobile = isMobile();
        this.start();
    }
    start(): void {
        this.animate();
    }
    animate(): void {
        gsap.config({
            force3D: true,
        });
        const tl = gsap.timeline({
            paused: true,
            defaults: {
                duration: 0.8,
                ease: 'power2.easeOut',
            },
        });
        tl.to(
            this.elms.mvHeading,
            {
                duration: 1,
                ease: 'power2.ease',
                y: 0,
            },
            0.2
        );
        tl.to(
            this.elms.mvHeading,
            {
                duration: 0.5,
                y: '-140%',
            },
            1.8
        );
        tl.to(
            this.elms.mvTitle,
            {
                duration: 0,
                ease: 'power2.ease',
                left: this.isMobile ? '50%' : '25%',
                top: this.isMobile ? '15%' : '19%',
            },
            2.3
        );
        tl.to(
            this.elms.mvHeading,
            {
                ease: 'power2.ease',
                y: 0,
            },
            3.3
        );
        tl.to(
            this.links,
            {
                ease: 'power2.ease',
                opacity: 1,
            },
            3.3
        );
        tl.play();
    }
}
