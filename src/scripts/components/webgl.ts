import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import throttle from 'lodash.throttle';
import { gsap } from 'gsap';
import { isMobile } from './isMobile';

export default class WebGL {
    winSize: {
        [s: string]: number;
    };
    elms: {
        [s: string]: HTMLElement;
    };
    dpr: number;
    three: {
        scene: THREE.Scene;
        renderer: THREE.WebGLRenderer | null;
        clock: THREE.Clock;
        redraw: any;
        camera: THREE.PerspectiveCamera | null;
        cameraFov: number;
        cameraAspect: number;
    };
    srcObj: string;
    objectPos: {
        [s: string]: number;
    };
    mousePos: {
        [s: string]: number;
    };
    flg: {
        [s: string]: boolean;
    };
    isMobile: boolean;
    constructor() {
        this.winSize = {
            wd: window.innerWidth,
            wh: window.innerHeight,
            halfWd: window.innerWidth * 0.5,
            halfWh: window.innerHeight * 0.5,
        };
        this.elms = {
            canvas: document.querySelector('[data-canvas]'),
            mvTitle: document.querySelector('[data-mv="heading"]'),
        };
        // デバイスピクセル比(最大値=2)
        this.dpr = Math.min(window.devicePixelRatio, 2);
        this.three = {
            scene: null,
            renderer: null,
            clock: null,
            redraw: null,
            camera: null,
            cameraFov: 50,
            cameraAspect: window.innerWidth / window.innerHeight,
        };
        this.srcObj = './obj/cushion.glb';
        this.objectPos = {
            topX: 0.9,
            bottomX: -1.2,
        };
        this.mousePos = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            moveX: 0.004,
            moveY: 0.003,
        };
        this.flg = {
            loaded: false,
        };
        this.isMobile = isMobile();
        this.init();
    }
    init(): void {
        this.initScene();
        this.initCamera();
        this.initClock();
        this.initRenderer();
        this.setLoading();
        this.setLight();
        this.handleEvents();
    }
    initScene(): void {
        // シーンを作成
        this.three.scene = new THREE.Scene();
    }
    initCamera(): void {
        // カメラを作成(視野角, スペクト比, near, far)
        this.three.camera = new THREE.PerspectiveCamera(this.three.cameraFov, this.winSize.wd / this.winSize.wh, this.three.cameraAspect, 1000);
        this.three.camera.position.set(this.isMobile ? 1 : 0, 0, 9);
    }
    initClock(): void {
        // 時間計測用
        this.three.clock = new THREE.Clock();
    }
    initRenderer(): void {
        // レンダラーを作成
        this.three.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, //背景色を設定しないとき、背景を透明にする
        });
        this.three.renderer.setPixelRatio(this.dpr); // retina対応
        this.three.renderer.setSize(this.winSize.wd, this.winSize.wh); // 画面サイズをセット
        this.three.renderer.physicallyCorrectLights = true;
        this.three.renderer.shadowMap.enabled = true; // シャドウを有効にする
        this.three.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // PCFShadowMapの結果から更に隣り合う影との間を線形補間して描画する
        this.elms.canvas.appendChild(this.three.renderer.domElement); // HTMLにcanvasを追加
        this.three.renderer.outputEncoding = THREE.GammaEncoding; // 出力エンコーディングを定義
    }
    setLight() {
        const positionArr = [
            [4, 1, 0, 5],
            [1, 3, 2, 4],
            [0, 1, 1, 2],
        ];

        for (let i = 0; i < positionArr.length; i++) {
            // 平行光源(色, 光の強さ)
            const directionalLight = new THREE.DirectionalLight(0xffffff, positionArr[i][3]);
            directionalLight.position.set(positionArr[i][0], positionArr[i][1], positionArr[i][2]);

            if (i == 0 || i == 2 || i == 3) {
                directionalLight.castShadow = true;
                directionalLight.shadow.camera.top = 50;
                directionalLight.shadow.camera.bottom = -50;
                directionalLight.shadow.camera.right = 50;
                directionalLight.shadow.camera.left = -50;
                directionalLight.shadow.mapSize.set(4096, 4096);
            }
            this.three.scene.add(directionalLight);
        }
    }
    setFloor(): void {
        // 床を生成
        const phongMaterial = new THREE.MeshPhongMaterial();
        const planeGeometry = new THREE.PlaneGeometry(50, 50);
        const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
        planeMesh.position.z = -4;
        planeMesh.receiveShadow = true;
        planeMesh.castShadow = true;
        this.three.scene.add(planeMesh);
    }
    setLoading() {
        this.setFloor();
        // glTF形式の3Dモデルを読み込む
        const loader = new GLTFLoader();
        loader.load(this.srcObj, (obj) => {
            const data = obj.scene;

            // 3Dモデルに影をつける
            data.traverse((n) => {
                //シーン上のすべてに対して
                n.castShadow = true;
                n.receiveShadow = true;
            });

            this.three.redraw = data; // 3Dモデルをredrawに入れる
            data.scale.set(this.isMobile ? 1 : 3, this.isMobile ? 1 : 3, this.isMobile ? 1 : 3);
            this.three.scene.add(data); // シーンに3Dモデルを追加
            this.flg.loaded = true;
            this.rendering(); // レンダリングを開始する
        });
    }
    rendering(): void {
        // 経過時間取得
        const time = this.three.clock.getElapsedTime();
        // マウスの位置を取得
        this.mousePos.x += (this.mousePos.targetX - this.mousePos.x) * this.mousePos.moveX;
        this.mousePos.y += (this.mousePos.targetY - this.mousePos.y) * this.mousePos.moveY;

        this.three.redraw.position.x = this.objectPos.topX - this.mousePos.x;
        this.three.redraw.position.y += Math.sin(time) * 0.0025;
        this.three.redraw.rotation.y += Math.cos(time) * 0.0015;
        this.three.redraw.rotation.x = this.mousePos.x * -1;

        if (this.three.camera) {
            // カメラの移動セット
            this.three.camera.position.y = this.mousePos.y * -1;
        }
        // レンダリングを実行
        requestAnimationFrame(this.rendering.bind(this));
        this.three.renderer.render(this.three.scene, this.three.camera);
        this.animate(); // アニメーション開始
    }
    animate(): void {
        gsap.config({
            force3D: true,
        });
        const tl = gsap.timeline({
            paused: true,
            defaults: {
                duration: 0.6,
                ease: 'power2.easeOut',
            },
        });
        tl.to(
            this.three.redraw.scale,
            {
                duration: 2.6,
                x: this.isMobile ? 0.3 : 0.5,
                y: this.isMobile ? 0.3 : 0.5,
                z: this.isMobile ? 0.3 : 0.5,
            },
            1.8
        );
        tl.to(
            this.three.redraw.rotation,
            {
                duration: 1.6,
                x: -0.3,
                y: -0.3,
            },
            4.4
        );
        tl.play();
    }
    handleEvents(): void {
        // マウスイベント登録
        document.addEventListener('pointermove', this.handleMouse.bind(this), false);
        // リサイズイベント登録
        window.addEventListener(
            'resize',
            throttle(() => {
                this.handleResize();
            }, 100),
            false
        );
    }
    handleMouse(event: any) {
        // マウスの画面中央からの位置を割合で取得
        this.mousePos.targetX = (this.winSize.halfWd - event.clientX) / this.winSize.halfWd;
        this.mousePos.targetY = (this.winSize.halfWh - event.clientY) / this.winSize.halfWh;
    }
    handleResize(): void {
        // リサイズ処理
        this.winSize = {
            wd: window.innerWidth,
            wh: window.innerHeight,
            halfWd: window.innerWidth * 0.5,
            halfWh: window.innerHeight * 0.5,
        };
        this.dpr = Math.min(window.devicePixelRatio, 2);
        if (this.three.camera) {
            // カメラの位置更新
            this.three.camera.aspect = this.winSize.wd / this.winSize.wh;
            this.three.camera.updateProjectionMatrix();
        }
        if (this.three.renderer) {
            // レンダラーの大きさ更新
            this.three.renderer.setSize(this.winSize.wd, this.winSize.wh);
            this.three.renderer.setPixelRatio(this.dpr);
        }
    }
}
