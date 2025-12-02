import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import {
    COURT_WIDTH,
    COURT_LENGTH,
    ATTACK_LINE_DISTANCE,
    NET_HEIGHT,
    POLE_HEIGHT,
    POLE_RADIUS
} from '../../constants';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

export const createCourtElements = (scene: THREE.Scene) => {
    // Outer Ground (Dark Green)
    const groundGeometry = new THREE.PlaneGeometry(COURT_WIDTH + 4, COURT_LENGTH + 4);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x006400,
        roughness: 1.0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Court Floor (Dark Yellow Sand)
    const sandTexture = new THREE.TextureLoader().load('/assets/pavement.png');
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(16, 32);
    const courtGeometry = new THREE.PlaneGeometry(COURT_WIDTH, COURT_LENGTH);
    const courtMaterial = new THREE.MeshStandardMaterial({
        roughness: 1.0,
        map: sandTexture
    });
    const courtFloor = new THREE.Mesh(courtGeometry, courtMaterial);
    courtFloor.rotation.x = -Math.PI / 2;
    courtFloor.position.y = 0.01;
    courtFloor.receiveShadow = true;
    scene.add(courtFloor);

    // Court Lines
    const lineMaterial = new LineMaterial({ color: 0xD49389, linewidth: 10 });
    const points = [];
    const halfW = COURT_WIDTH / 2;
    const halfL = COURT_LENGTH / 2;
    const lineY = 0.011;

    function addSegment(a, b) {
        points.push(a.x, a.y, a.z);
        points.push(b.x, b.y, b.z);

        // Add a NaN “break” so MeshLine doesn't connect segments
        points.push(NaN, NaN, NaN);
    }

    // Boundary lines
    addSegment(new THREE.Vector3(-halfW, lineY, -halfL), new THREE.Vector3(-halfW, lineY, halfL));
    addSegment(new THREE.Vector3(halfW, lineY, -halfL), new THREE.Vector3(halfW, lineY, halfL));
    addSegment(new THREE.Vector3(-halfW, lineY, -halfL), new THREE.Vector3(halfW, lineY, -halfL));
    addSegment(new THREE.Vector3(-halfW, lineY, halfL), new THREE.Vector3(halfW, lineY, halfL));

    // Center line
    addSegment(new THREE.Vector3(-halfW, lineY, 0), new THREE.Vector3(halfW, lineY, 0));

    // Attack lines
    addSegment(new THREE.Vector3(-halfW, lineY, ATTACK_LINE_DISTANCE), new THREE.Vector3(halfW, lineY, ATTACK_LINE_DISTANCE));
    addSegment(new THREE.Vector3(-halfW, lineY, -ATTACK_LINE_DISTANCE), new THREE.Vector3(halfW, lineY, -ATTACK_LINE_DISTANCE));

    // Line geometry
    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions(points);

    // Create the Line2 object
    const lines = new Line2(lineGeometry, lineMaterial);
    lines.computeLineDistances();
    scene.add(lines);

    // Net Poles
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2E9DEA, roughness: 0.2, metalness: 0.6 });
    const poleGeometry = new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 32);

    const pole1 = new THREE.Mesh(poleGeometry, poleMaterial);
    pole1.position.set(-(halfW + 0.5), POLE_HEIGHT / 2, 0);
    pole1.castShadow = true;
    scene.add(pole1);

    const pole2 = new THREE.Mesh(poleGeometry, poleMaterial);
    pole2.position.set(halfW + 0.5, POLE_HEIGHT / 2, 0);
    pole2.castShadow = true;
    scene.add(pole2);

    // Net 3D Model Loading
    const loader = new GLTFLoader();

    loader.load(
        '/models/volleyball_net.glb',
        (gltf) => {
            const netModel = gltf.scene;
            netModel.scale.set(1, 1, 1);
            netModel.position.set(0, NET_HEIGHT - 0.6, 0);

            netModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(netModel);
        },
        (progress) => {
            console.log('Chargement du modèle:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.warn('Modèle 3D non trouvé, utilisation du filet généré par défaut:', error);
            createFallbackNet(scene);
        }
    );

    return { sandTexture, lineGeometry, lineMaterial };
};

const createFallbackNet = (scene: THREE.Scene) => {
    const netGroup = new THREE.Group();

    const netMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1
    });

    const netWidth = COURT_WIDTH;
    const netHeight = 1.2;
    const meshSize = 0.15;
    const wireThickness = 0.005;

    const horizontalMeshes = Math.floor(netWidth / meshSize);
    const verticalMeshes = Math.floor(netHeight / meshSize);

    for (let i = 0; i <= verticalMeshes; i++) {
        const y = (i * meshSize) - (netHeight / 2);
        const wireGeometry = new THREE.BoxGeometry(netWidth, wireThickness, wireThickness);
        const wire = new THREE.Mesh(wireGeometry, netMaterial);
        wire.position.set(0, y, 0);
        netGroup.add(wire);
    }

    for (let i = 0; i <= horizontalMeshes; i++) {
        const x = (i * meshSize) - (netWidth / 2);
        const wireGeometry = new THREE.BoxGeometry(wireThickness, netHeight, wireThickness);
        const wire = new THREE.Mesh(wireGeometry, netMaterial);
        wire.position.set(x, 0, 0);
        netGroup.add(wire);
    }

    netGroup.position.set(0, NET_HEIGHT - 0.6, 0);
    netGroup.castShadow = true;
    netGroup.receiveShadow = true;
    scene.add(netGroup);
};

