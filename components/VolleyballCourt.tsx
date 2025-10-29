import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three-stdlib';
import { 
    COURT_WIDTH, 
    COURT_LENGTH, 
    ATTACK_LINE_DISTANCE, 
    NET_HEIGHT, 
    POLE_HEIGHT, 
    POLE_RADIUS, 
    BALL_RADIUS 
} from '../constants';

const VolleyballCourt: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const currentMount = mountRef.current;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a2a);
        scene.fog = new THREE.Fog(0x0a0a2a, 20, 50);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(10, 8, 12);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        currentMount.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera from going under the court
        controls.target.set(0, 0, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(-15, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        scene.add(directionalLight);
        
        // --- Court Elements ---

        // Outer Ground (Dark Green)
        const groundGeometry = new THREE.PlaneGeometry(COURT_WIDTH + 4, COURT_LENGTH + 4);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x006400, // Dark Green
            roughness: 1.0,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Court Floor (Dark Yellow Sand)
        const sandTexture = new THREE.TextureLoader().load('/assets/sand.jpg');
        sandTexture.wrapS = THREE.RepeatWrapping;
        sandTexture.wrapT = THREE.RepeatWrapping;
        sandTexture.repeat.set(4, 8); // Adjust repeat for the court size
        const courtGeometry = new THREE.PlaneGeometry(COURT_WIDTH, COURT_LENGTH);
        const courtMaterial = new THREE.MeshStandardMaterial({
            roughness: 1.0,
            map: sandTexture
        });
        const courtFloor = new THREE.Mesh(courtGeometry, courtMaterial);
        courtFloor.rotation.x = -Math.PI / 2;
        courtFloor.position.y = 0.01; // Place it slightly above the green ground
        courtFloor.receiveShadow = true;
        scene.add(courtFloor);


        // Court Lines
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        const points = [];
        const halfW = COURT_WIDTH / 2;
        const halfL = COURT_LENGTH / 2;
        const lineY = 0.011; // Position lines just above the court surface
        
        // Boundary lines
        // Side 1 (left)
        points.push(new THREE.Vector3(-halfW, lineY, -halfL), new THREE.Vector3(-halfW, lineY, halfL));
        // Side 2 (right)
        points.push(new THREE.Vector3(halfW, lineY, -halfL), new THREE.Vector3(halfW, lineY, halfL));
        // Back line
        points.push(new THREE.Vector3(-halfW, lineY, -halfL), new THREE.Vector3(halfW, lineY, -halfL));
        // Front line
        points.push(new THREE.Vector3(-halfW, lineY, halfL), new THREE.Vector3(halfW, lineY, halfL));

        // Center line
        points.push(new THREE.Vector3(-halfW, lineY, 0), new THREE.Vector3(halfW, lineY, 0));

        // Attack lines
        points.push(new THREE.Vector3(-halfW, lineY, ATTACK_LINE_DISTANCE), new THREE.Vector3(halfW, lineY, ATTACK_LINE_DISTANCE));
        points.push(new THREE.Vector3(-halfW, lineY, -ATTACK_LINE_DISTANCE), new THREE.Vector3(halfW, lineY, -ATTACK_LINE_DISTANCE));

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);

        // Net Poles
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.2, metalness: 0.8 });
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
        let netModel: THREE.Group | null = null;
        
        // Try to load the 3D model, fallback to generated net if not found
        loader.load(
            '/models/volleyball_net.glb', // Chemin vers votre modèle 3D
            (gltf) => {
                netModel = gltf.scene;
                
                // Scale and position the model
                netModel.scale.set(1, 1, 1); // Ajustez selon votre modèle
                netModel.position.set(0, NET_HEIGHT - 0.6, 0);
                
                // Enable shadows
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
                
                // Fallback: Create a simple net if model is not found
                const netGroup = new THREE.Group();
                
                // Net material
                const netMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide,
                    roughness: 0.8,
                    metalness: 0.1
                });
                
                // Create net mesh pattern
                const netWidth = COURT_WIDTH;
                const netHeight = 1.2;
                const meshSize = 0.15;
                const wireThickness = 0.005;
                
                // Calculate number of meshes
                const horizontalMeshes = Math.floor(netWidth / meshSize);
                const verticalMeshes = Math.floor(netHeight / meshSize);
                
                // Create horizontal wires
                for (let i = 0; i <= verticalMeshes; i++) {
                    const y = (i * meshSize) - (netHeight / 2);
                    const wireGeometry = new THREE.BoxGeometry(netWidth, wireThickness, wireThickness);
                    const wire = new THREE.Mesh(wireGeometry, netMaterial);
                    wire.position.set(0, y, 0);
                    netGroup.add(wire);
                }
                
                // Create vertical wires
                for (let i = 0; i <= horizontalMeshes; i++) {
                    const x = (i * meshSize) - (netWidth / 2);
                    const wireGeometry = new THREE.BoxGeometry(wireThickness, netHeight, wireThickness);
                    const wire = new THREE.Mesh(wireGeometry, netMaterial);
                    wire.position.set(x, 0, 0);
                    netGroup.add(wire);
                }
                
                // Position the net
                netGroup.position.set(0, NET_HEIGHT - 0.6, 0);
                netGroup.castShadow = true;
                netGroup.receiveShadow = true;
                scene.add(netGroup);
            }
        );
        
        // Volleyball
        const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.2 });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.set(2, BALL_RADIUS + 2, 4);
        ball.castShadow = true;
        ball.receiveShadow = true;
        scene.add(ball);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!currentMount) return;
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
            // Dispose of Three.js objects
            scene.traverse(object => {
                if (object instanceof THREE.Mesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });
            lineGeometry.dispose();
            lineMaterial.dispose();
            sandTexture.dispose();
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="w-full h-full" />;
};

export default VolleyballCourt;