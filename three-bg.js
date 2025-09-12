import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let scene, camera, renderer, particles, dnaGroup;
let particlesGeometryRef = null;
let particleSpeeds = null;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
const ENABLE_CAMERA_SWAY = false;

function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';

    camera.position.z = 25;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);

    // Removed DNA helix line to keep only particles background

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesVertices = [];
    particleSpeeds = new Float32Array(3500);
    for (let i = 0; i < 3500; i++) {
        const x = (Math.random() - 0.5) * 80;       // moderate horizontal spread
        const y = (Math.random() - 0.5) * 80;       // moderate vertical spread
        const z = -10 - Math.random() * 150;        // keep particles very close (-10 to -160)
        particlesVertices.push(x, y, z);
        particleSpeeds[i] = 0.04 + Math.random() * 0.04; // per-particle speed toward camera
    }
    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlesVertices, 3));
    particlesGeometryRef = particlesGeometry;
    particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({
        color: 0x00ffcc,
        size: 0.25,
        blending: THREE.AdditiveBlending,
        transparent: true
    }));
    scene.add(particles);

    // Add horizontally oriented double-strand DNA helix
    dnaGroup = new THREE.Group();
    const strandMatA = new THREE.MeshBasicMaterial({ color: 0x00ffd5, transparent: true, opacity: 0.85 });
    const strandMatB = new THREE.MeshBasicMaterial({ color: 0x2ad9ff, transparent: true, opacity: 0.85 });
    const rungMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.45 });

    const pointsA = [];
    const pointsB = [];
    const amplitude = 10;          // helix radius (slightly smaller)
    const length = 180;            // total length along X (shorter)
    const step = 0.5;              // finer sampling for smoothness
    const freq = 0.24;             // slightly longer wavelength

    for (let x = -length; x <= length; x += step) {
        const yA = amplitude * Math.sin(freq * x);
        const zA = -40 + amplitude * Math.cos(freq * x);
        const yB = amplitude * Math.sin(freq * x + Math.PI);
        const zB = -40 + amplitude * Math.cos(freq * x + Math.PI);
        pointsA.push(new THREE.Vector3(x, yA, zA));
        pointsB.push(new THREE.Vector3(x, yB, zB));
    }

    // Create thick strands using TubeGeometry
    const curveA = new THREE.CatmullRomCurve3(pointsA);
    const curveB = new THREE.CatmullRomCurve3(pointsB);
    const tubeGeomA = new THREE.TubeGeometry(curveA, 900, 0.4, 14, false);
    const tubeGeomB = new THREE.TubeGeometry(curveB, 900, 0.4, 14, false);
    const strandA = new THREE.Mesh(tubeGeomA, strandMatA);
    const strandB = new THREE.Mesh(tubeGeomB, strandMatB);
    dnaGroup.add(strandA);
    dnaGroup.add(strandB);

    // Rungs connecting strands at intervals
    const rungGeom = new THREE.CylinderGeometry(0.38, 0.38, 1, 12);
    for (let i = 0; i < pointsA.length; i += 10) {
        const pA = pointsA[i];
        const pB = pointsB[i];
        const rung = new THREE.Mesh(rungGeom, rungMat);
        const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(pB, pA);
        const len = dir.length();
        rung.scale.set(1, len, 1);
        const axis = new THREE.Vector3(0, 1, 0).cross(dir.clone().normalize());
        const angle = Math.acos(new THREE.Vector3(0, 1, 0).dot(dir.clone().normalize()));
        if (axis.lengthSq() > 0) {
            rung.quaternion.setFromAxisAngle(axis.normalize(), angle);
        }
        rung.position.copy(mid);
        dnaGroup.add(rung);
    }

    // Slight tilt so the horizontal helix has depth
    dnaGroup.rotation.x = 0.25;
    scene.add(dnaGroup);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (particles && particlesGeometryRef && particleSpeeds) {
        const pos = particlesGeometryRef.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
            const z = pos.getZ(i) + particleSpeeds[i];
            if (z > -5) {
                // wrap: send slightly behind with slight x/y jitter
                const nx = (Math.random() - 0.5) * 80;
                const ny = (Math.random() - 0.5) * 80;
                const nz = -160 - Math.random() * 20;
                pos.setXYZ(i, nx, ny, nz);
            } else {
                pos.setZ(i, z);
            }
        }
        pos.needsUpdate = true;
        // subtle rotation for parallax
        particles.rotation.z += 0.0006;
    }

    if (dnaGroup) {
        dnaGroup.rotation.y += 0.01; // horizontal spin
    }

    if (ENABLE_CAMERA_SWAY) {
        const targetX = (mouseX - windowHalfX) * 0.0001;
        const targetY = (mouseY - windowHalfY) * 0.0001;
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (-targetY - camera.position.y) * 0.05;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

// Kick off animation after DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeJS);
} else {
    initThreeJS();
}


