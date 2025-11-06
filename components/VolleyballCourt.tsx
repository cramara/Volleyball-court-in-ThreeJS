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
        
        // Function to create a player (modèle un peu amélioré + rôle)
        const createPlayer = (
            x: number,
            z: number,
            teamColor: number,
            role: 'passeur' | 'attaquant' | 'defenseur',
            team: 'team1' | 'team2'
        ) => {
            const playerGroup = new THREE.Group();
            playerGroup.userData = { role, team, state: 'idle' };
            
            // Dimensions harmonisées pour éviter l'interpénétration
            const bodyRadius = 0.16;
            const shortHeight = 0.40; // 40 cm
            const shortCenterY = shortHeight / 2; // 0.20
            const jerseyHeight = 0.80; // 80 cm
            const jerseyCenterY = shortHeight + jerseyHeight / 2; // 0.40 + 0.40 = 0.80

            // Torse (cylindre) + maillot
            const jerseyGeometry = new THREE.CylinderGeometry(bodyRadius, bodyRadius, jerseyHeight, 20);
            const jerseyMaterial = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.6, metalness: 0.05 });
            const jersey = new THREE.Mesh(jerseyGeometry, jerseyMaterial);
            jersey.position.y = jerseyCenterY;
            jersey.castShadow = true;
            jersey.receiveShadow = true;
            playerGroup.add(jersey);

            // Short (cylindre plus sombre)
            const shortGeometry = new THREE.CylinderGeometry(bodyRadius * 0.95, bodyRadius * 0.95, shortHeight, 18);
            const shortMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
            const shortMesh = new THREE.Mesh(shortGeometry, shortMaterial);
            shortMesh.position.y = shortCenterY;
            shortMesh.castShadow = true;
            shortMesh.receiveShadow = true;
            playerGroup.add(shortMesh);
            
            // Head (sphere)
            const headRadius = 0.12;
            const headGeometry = new THREE.SphereGeometry(headRadius, 16, 16);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = jerseyCenterY + jerseyHeight / 2 + headRadius + 0.02; // ~1.32m
            head.castShadow = true;
            head.receiveShadow = true;
            playerGroup.add(head);
            
            // Arms (cylinders)
            const armLength = 0.45;
            const armRadius = 0.05;
            const armGeometry = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8);
            const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });
            
            // Left arm
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.rotation.z = Math.PI / 2;
            leftArm.position.set(-bodyRadius - armLength / 2, jerseyCenterY + 0.10, 0);
            leftArm.castShadow = true;
            playerGroup.add(leftArm);
            
            // Right arm
            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.rotation.z = -Math.PI / 2;
            rightArm.position.set(bodyRadius + armLength / 2, jerseyCenterY + 0.10, 0);
            rightArm.castShadow = true;
            playerGroup.add(rightArm);
            
            // Legs (cylinders)
            const legLength = 0.40; // 40 cm jusqu'en haut du short
            const legRadius = 0.07;
            const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legLength, 8);
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.9 });
            
            // Left leg
            const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
            leftLeg.position.set(-bodyRadius * 0.7, legLength / 2, 0); // centre à 0.20 → haut à 0.40
            leftLeg.castShadow = true;
            playerGroup.add(leftLeg);
            
            // Right leg
            const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
            rightLeg.position.set(bodyRadius * 0.7, legLength / 2, 0);
            rightLeg.castShadow = true;
            playerGroup.add(rightLeg);

            // Chaussures
            const shoeGeometry = new THREE.BoxGeometry(0.16, 0.06, 0.28);
            const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
            const shoeL = new THREE.Mesh(shoeGeometry, shoeMat);
            shoeL.position.set(-bodyRadius * 0.7, 0.03, 0.08);
            shoeL.castShadow = true;
            const shoeR = new THREE.Mesh(shoeGeometry, shoeMat);
            shoeR.position.set(bodyRadius * 0.7, 0.03, 0.08);
            shoeR.castShadow = true;
            playerGroup.add(shoeL);
            playerGroup.add(shoeR);

            // Bande de manche (couleur du maillot) pour distinguer du bras
            const sleeveGeometry = new THREE.CylinderGeometry(armRadius + 0.005, armRadius + 0.005, 0.18, 10);
            const sleeveMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.6 });
            const sleeveL = new THREE.Mesh(sleeveGeometry, sleeveMat);
            sleeveL.rotation.z = Math.PI / 2;
            sleeveL.position.set(-bodyRadius - 0.2, jerseyCenterY + 0.15, 0);
            const sleeveR = new THREE.Mesh(sleeveGeometry, sleeveMat);
            sleeveR.rotation.z = -Math.PI / 2;
            sleeveR.position.set(bodyRadius + 0.2, jerseyCenterY + 0.15, 0);
            playerGroup.add(sleeveL);
            playerGroup.add(sleeveR);

            // Indicateur de rôle (anneau coloré au sol)
            const roleColor = role === 'passeur' ? 0xffff00 : role === 'attaquant' ? 0x00ff88 : 0x8888ff;
            const ringGeometry = new THREE.TorusGeometry(0.28, 0.02, 8, 20);
            const ringMaterial = new THREE.MeshStandardMaterial({ color: roleColor, emissive: 0x000000, roughness: 0.7 });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.01;
            ring.castShadow = false;
            ring.receiveShadow = false;
            playerGroup.add(ring);
            
            // Position the player
            playerGroup.position.set(x, 0, z);

            // Orientation spécifique du passeur: face à ses coéquipiers
            if (role === 'passeur') {
                // Sur le côté bleu (team1, z>0), les coéquipiers sont vers +z
                // Sur le côté rouge (team2, z<0), les coéquipiers sont vers -z
                playerGroup.rotation.y = team === 'team1' ? 0 : Math.PI;
            }
            
            return playerGroup;
        };
        
        // Create players - Team 1 (blue, z > 0) : 6 joueurs (passeur, 2 attaquants, 3 défenseurs)
        const team1Color = 0x0066ff;
        const team1Positions: Array<{x: number, z: number, role: 'passeur' | 'attaquant' | 'defenseur'}> = [
            { x: -2.5, z: 3.8, role: 'attaquant' }, // avant gauche
            { x: 0.0,  z: 3.0, role: 'passeur'  }, // passeur rapproché du filet
            { x: 2.5,  z: 3.8, role: 'attaquant' }, // avant droit
            { x: -2.5, z: 6.5, role: 'defenseur' }, // arrière gauche
            { x: 0.0,  z: 6.5, role: 'defenseur' }, // arrière centre
            { x: 2.5,  z: 6.5, role: 'defenseur' }  // arrière droit
        ];
        const playersTeam1 = team1Positions.map(p => createPlayer(p.x, p.z, team1Color, p.role, 'team1'));
        playersTeam1.forEach(player => scene.add(player));

        // Create players - Team 2 (red, z < 0) : 6 joueurs
        const team2Color = 0xff3333;
        const team2Positions: Array<{x: number, z: number, role: 'passeur' | 'attaquant' | 'defenseur'}> = [
            { x: -2.5, z: -3.8, role: 'attaquant' },
            { x: 0.0,  z: -3.0, role: 'passeur'  }, // passeur rapproché du filet
            { x: 2.5,  z: -3.8, role: 'attaquant' },
            { x: -2.5, z: -6.5, role: 'defenseur' },
            { x: 0.0,  z: -6.5, role: 'defenseur' },
            { x: 2.5,  z: -6.5, role: 'defenseur' }
        ];
        const playersTeam2 = team2Positions.map(p => createPlayer(p.x, p.z, team2Color, p.role, 'team2'));
        playersTeam2.forEach(player => scene.add(player));
        
        // Volleyball
        const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.2 });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.castShadow = true;
        ball.receiveShadow = true;
        scene.add(ball);

        // Animation: aller-retour entre joueurs (logic volley)
        const PLAYER_THROW_HEIGHT = 1.6;
        const ARC_HEIGHT = 0.8; // hauteur max de l'arc
        let t = 0; // 0 -> 1 interpolation
        // vitesses selon le type d'action
        const CROSS_SPEED = 0.01; // envoi de l'autre côté
        const PASS_SPEED = 0.013; // passes intra-équipe (légèrement plus vite)
        let legSpeed = PASS_SPEED;

        // Helpers de sélection (déclarés avant utilisation)
        const pickRandom = (arr: THREE.Group[]) => arr[Math.floor(Math.random() * arr.length)];
        const pickRandomDifferent = (arr: THREE.Group[], exclude: THREE.Group) => {
            const candidates = arr.filter(g => g !== exclude);
            return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : exclude;
        };
        const isInTeam = (g: THREE.Group, team: THREE.Group[]) => team.includes(g);
        const getTeamSide = (g: THREE.Group): 'team1' | 'team2' => (isInTeam(g, playersTeam1) ? 'team1' : 'team2');
        const getRole = (g: THREE.Group): 'passeur' | 'attaquant' | 'defenseur' => g.userData.role;
        const getTeamArray = (side: 'team1' | 'team2') => (side === 'team1' ? playersTeam1 : playersTeam2);
        const getOppTeamArray = (side: 'team1' | 'team2') => (side === 'team1' ? playersTeam2 : playersTeam1);
        const findSetter = (teamArr: THREE.Group[]) => teamArr.find(g => g.userData.role === 'passeur') as THREE.Group;
        const findAttackers = (teamArr: THREE.Group[]) => teamArr.filter(g => g.userData.role === 'attaquant');

        // Sélection initiale: du passeur rouge vers le passeur bleu
        let fromGroup = findSetter(playersTeam2);
        let toGroup = findSetter(playersTeam1);

        const tmpFrom = new THREE.Vector3();
        const tmpTo = new THREE.Vector3();
        const tmpPos = new THREE.Vector3();

        // place la balle au point de départ initial
        fromGroup.getWorldPosition(tmpFrom);
        ball.position.set(tmpFrom.x, PLAYER_THROW_HEIGHT, tmpFrom.z);
        // init vitesse de la première jambe (from red setter → blue setter) = cross
        legSpeed = CROSS_SPEED;

        // gestion simple des sauts (pour les attaques)
        const startJump = (g: THREE.Group) => {
            g.userData.jump = g.userData.jump || {};
            g.userData.jump.phase = 0;
            g.userData.jump.active = true;
            g.userData.jump.height = 0.5; // hauteur du saut
        };
        const updateJump = (g: THREE.Group) => {
            if (!g.userData.jump || !g.userData.jump.active) return;
            g.userData.jump.phase += 0.08; // vitesse du saut
            const p = g.userData.jump.phase;
            if (p >= 1) {
                g.userData.jump.active = false;
                g.position.y = 0;
                return;
            }
            // mouvement sinus (montée/descente)
            const y = Math.sin(Math.PI * p) * g.userData.jump.height;
            g.position.y = y;
        };

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // avancer le temps puis gérer l'éventuel switch
            t += legSpeed;
            if (t >= 1) {
                t = 0;
                // le receveur devient l'émetteur
                fromGroup = toGroup;

                // États de rallye pour règle volley ajustée
                (animate as any)._lastTeam = (animate as any)._lastTeam ?? getTeamSide(fromGroup);
                (animate as any)._touchCount = (animate as any)._touchCount ?? 0; // 0,1,2 au sein de l'équipe
                (animate as any)._forceCross = (animate as any)._forceCross ?? false;

                const currentTeamSide = getTeamSide(fromGroup);
                if ((animate as any)._lastTeam === currentTeamSide) {
                    (animate as any)._touchCount += 1;
                } else {
                    (animate as any)._touchCount = 1; // nouvelle prise côté opposé
                }

                const teamArr = getTeamArray(currentTeamSide);
                const oppArr = getOppTeamArray(currentTeamSide);
                const setter = findSetter(teamArr);
                const attackers = findAttackers(teamArr);

                // Si ce joueur est en état d'attaque au moment de la réception, déclencher le saut immédiatement
                if (fromGroup.userData && fromGroup.userData.state === 'attaque') {
                    startJump(fromGroup);
                }

                // Si on avait demandé une attaque directe après la prochaine réception
                if ((animate as any)._forceCross) {
                    toGroup = pickRandom(oppArr);
                    (animate as any)._forceCross = false;
                    // le joueur qui vient de frapper revient à l'état idle
                    if (fromGroup.userData) fromGroup.userData.state = 'idle';
                    // vitesse pour traverser le filet
                    legSpeed = CROSS_SPEED;
                } else {
                    // Choisir le prochain receveur en respectant la règle:
                    // - 2e touche doit être au passeur (sauf si passeur touche en 1er)
                    // - si le passeur touche en 1er: 2e à un attaquant et attaque directe en face
                    if ((animate as any)._touchCount === 1) {
                        if (getRole(fromGroup) === 'passeur') {
                            // Passeur a touché en 1er → 2e vers un attaquant, et on forcera la suite en face
                            const attacker = pickRandom(attackers);
                            if (attacker) {
                                toGroup = attacker;
                                // Marquer l'attaquant en état d'attaque (utilisé plus tard)
                                attacker.userData.state = 'attaque';
                                (animate as any)._forceCross = true; // à l'arrivée suivante, on envoie en face
                                // vitesse intra-équipe
                                legSpeed = PASS_SPEED;
                            } else {
                                // fallback: si aucun attaquant, passe en face
                                toGroup = pickRandom(oppArr);
                                legSpeed = CROSS_SPEED;
                            }
                        } else {
                            // 1re touche par autre qu'un passeur → 2e touche au passeur
                            toGroup = setter ?? pickRandomDifferent(teamArr, fromGroup);
                            legSpeed = PASS_SPEED;
                        }
                    } else if ((animate as any)._touchCount === 2) {
                        // 3e touche au sein de l'équipe: si on vient du passeur, envoie à un attaquant sinon en face
                        if (getRole(fromGroup) === 'passeur') {
                            const attacker = pickRandom(attackers);
                            if (attacker) {
                                toGroup = attacker;
                                attacker.userData.state = 'attaque';
                                // la prochaine arrivée sur attaquant sera la 3e touche → ensuite en face
                                (animate as any)._forceCross = true;
                                legSpeed = PASS_SPEED;
                            } else {
                                toGroup = pickRandom(oppArr);
                                (animate as any)._touchCount = 0;
                                legSpeed = CROSS_SPEED;
                            }
                        } else {
                            // si ce n'est pas le passeur, on considère que c'est l'attaque → en face directement
                            toGroup = pickRandom(oppArr);
                            (animate as any)._touchCount = 0;
                            // démarrer le saut de l'attaquant (fromGroup) car il frappe
                            startJump(fromGroup);
                            legSpeed = CROSS_SPEED;
                        }
                    } else {
                        // sécurité: si plus de 3 touches, en face
                        toGroup = pickRandom(oppArr);
                        (animate as any)._touchCount = 0;
                        legSpeed = CROSS_SPEED;
                    }
                }

                (animate as any)._lastTeam = currentTeamSide;
            }
            // positions de départ et d'arrivée à hauteur de service (après éventuel switch)
            fromGroup.getWorldPosition(tmpFrom);
            toGroup.getWorldPosition(tmpTo);
            tmpFrom.y = PLAYER_THROW_HEIGHT;
            tmpTo.y = PLAYER_THROW_HEIGHT;

            tmpPos.lerpVectors(tmpFrom, tmpTo, t);
            const arc = Math.sin(Math.PI * t) * ARC_HEIGHT;
            ball.position.set(tmpPos.x, tmpPos.y + arc, tmpPos.z);

            // légère rotation pour le réalisme
            ball.rotation.x += 0.02;
            ball.rotation.y += 0.015;

            // mettre à jour les sauts éventuels (les deux équipes)
            playersTeam1.forEach(updateJump);
            playersTeam2.forEach(updateJump);

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