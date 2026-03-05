import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加银河背景
const textureLoader = new THREE.TextureLoader();
const galaxyTexture = textureLoader.load('https://example.com/galaxy.jpg');  // 替换为银河背景图链接
const galaxyMaterial = new THREE.MeshBasicMaterial({
    map: galaxyTexture,
    side: THREE.BackSide
});
const galaxyGeometry = new THREE.SphereGeometry(1000, 32, 32);
const galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);

// 添加星星（米字形衍射星）
const starCount = 5000;
const stars = new THREE.BufferGeometry();
const positions = new Float32Array(starCount * 3);  // 每个星星有 x, y, z 三个坐标

for (let i = 0; i < starCount; i++) {
    const x = Math.random() * 2000 - 1000;
    const y = Math.random() * 2000 - 1000;
    const z = Math.random() * 2000 - 1000;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
}

stars.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const starMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 1,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
});

const starField = new THREE.Points(stars, starMaterial);
scene.add(starField);

// 闪烁算法（实现星星亮度变化）
function updateStars() {
    starField.material.opacity = 0.7 + Math.sin(Date.now() * 0.001) * 0.3;
    starField.rotation.x += 0.0001;
    starField.rotation.y += 0.0001;
}

// 流星尾迹粒子
const meteorMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 5,
    opacity: 1,
    transparent: true,
    blending: THREE.AdditiveBlending
});

let meteorGeometry = new THREE.BufferGeometry();
let meteor = new THREE.Vector3(0, 0, 0);
meteorGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([meteor.x, meteor.y, meteor.z]), 3));
const meteorField = new THREE.Points(meteorGeometry, meteorMaterial);
scene.add(meteorField);

// 生成流星尾迹
function createMeteor() {
    meteor.x = Math.random() * 2000 - 1000;
    meteor.y = Math.random() * 2000 - 1000;
    meteor.z = Math.random() * 2000 - 1000;
    meteorGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([meteor.x, meteor.y, meteor.z]), 3));
}

// 北斗七星坐标，使用这些坐标生成星星
const northStarCoords = [
    { x: 0, y: 0 },
    { x: 150, y: 25 },
    { x: 215, y: 90 },
    { x: 300, y: 170 },
    { x: 290, y: 265 },
    { x: 455, y: 320 },
    { x: 515, y: 225 }
];

northStarCoords.forEach(coord => {
    const star = new THREE.Mesh(
        new THREE.SphereGeometry(5, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    star.position.set(coord.x, coord.y, 0);
    scene.add(star);
});

camera.position.z = 500;

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    updateStars();
    createMeteor();
    renderer.render(scene, camera);
}

// 适应窗口大小变化
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();