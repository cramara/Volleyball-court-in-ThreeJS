import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import GUI from 'lil-gui';
import { createSceneSetup, setupResizeHandler } from './scene/SceneSetup';
import { createCourtElements } from './court/CourtElements';
import { createPlayers } from './players/Player';
import { updateJump, updateReturnHome } from './players/PlayerAnimations';
import { findSetter, getTeamSide } from './game/GameHelpers';
import { GameState, selectNextReceiver, updateGameState, getBallTargetPosition } from './game/GameLogic';
import { createBall, updateBallPosition } from './animation/BallAnimation';
import { FirstPersonCameraState, updateFirstPersonCamera, toggleFirstPersonView, switchToPlayer, handleMouseMove } from './camera/FirstPersonCamera';

function createTree(THREE: any) {
    const tree = new THREE.Group();

    // Tronc
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.75;

    // Feuillage
    const foliageGeometry = new THREE.ConeGeometry(1, 2, 12);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 2.2;

    tree.add(trunk);
    tree.add(foliage);

    return tree;
}

export const createVoxelBench = (scene: THREE.Scene, x: number, z: number, rotationY: number = 0) => {
    const benchGroup = new THREE.Group();

    // Material
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });  // Grey

    // Create the bench
    // Width: 3, Height: 0.2, Deep: 1
    const seatGeo = new THREE.BoxGeometry(2, 0.2, 1);
    const seat = new THREE.Mesh(seatGeo, woodMaterial);
    seat.position.y = 0.6;
    seat.castShadow = true;
    seat.receiveShadow = true;
    benchGroup.add(seat);

    // Bench Back
    const backrestGeo = new THREE.BoxGeometry(2, 0.6, 0.2);
    const backrest = new THREE.Mesh(backrestGeo, woodMaterial);
    backrest.position.set(0, 0.7, -0.4);
    backrest.castShadow = true;
    backrest.receiveShadow = true;
    benchGroup.add(backrest);

    // Left foot
    const legGeo = new THREE.BoxGeometry(0.3, 0.6, 0.8);
    const legLeft = new THREE.Mesh(legGeo, legMaterial);
    legLeft.position.set(-0.7, 0.3, 0);
    legLeft.castShadow = true;
    legLeft.receiveShadow = true;
    benchGroup.add(legLeft);

    // Right foot
    const legRight = new THREE.Mesh(legGeo, legMaterial);
    legRight.position.set(0.7, 0.3, 0);
    legRight.castShadow = true;
    legRight.receiveShadow = true;
    benchGroup.add(legRight);

    // Position and rotation
    benchGroup.position.set(x, 0, z);
    benchGroup.rotation.y = rotationY;

    scene.add(benchGroup);
};


const PLAYER_THROW_HEIGHT = 1.6;
const CROSS_SPEED = 0.01;

const sunPosition = new THREE.Vector3();

const sunControls = {
    play: true,
    speed: 1.0,
    t: 0.0,
    intensity: 1.2,
};

const gui = new GUI();

// --- Animation ---
gui.add(sunControls, 'play').name('Play / Pause Sun');
gui.add(sunControls, 'speed', 0, 5, 0.01).name('Time Speed');

// --- Manual sun position ---
gui.add(sunControls, 't', 0, 1, 0.0001).name('Sun Position');

// --- Lighting ---
gui.add(sunControls, 'intensity', 0, 3, 0.01).name('Sun Intensity');

const VolleyballCourt: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const currentMount = mountRef.current;

        // Configuration de la scène
        const { scene, camera, renderer, controls, sky, sunLight } = createSceneSetup(currentMount);

        // Création des éléments du terrain
        const { sandTexture, lineGeometry, lineMaterial } = createCourtElements(scene);

        // Elevation (altitude) — angle above horizon
        // Azimuth — angle along the horizon
        function updateSun(elevationDeg, azimuthDeg) {
            const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
            const theta = THREE.MathUtils.degToRad(azimuthDeg);

            sunPosition.setFromSphericalCoords(1, phi, theta);

            sunLight.position.copy(sunPosition);
            sky.material.uniforms['sunPosition'].value.copy(sunPosition);
        }

        let time = 0;

        function animateSun(delta) {
            if (sunControls.play) {
                time += delta * sunControls.speed * 0.1;
                sunControls.t = time % 1;
            }

            const t = sunControls.t;

            // Sun path:
            const elevation = Math.sin(t * Math.PI) * 60;  // 0 → 60° → 0
            const azimuth = 90 - t * 360;

            updateSun(elevation, azimuth);
            sunLight.intensity = sunControls.intensity;
        }

        // === Ajout de 3 arbres de chaque côté ===
        const leftPositions = [-8, 0, 8];
        const rightPositions = [-8, 0, 8];

        leftPositions.forEach((z) => {
            const tree = createTree(THREE);
            tree.position.set(-6, 0, z); // côté gauche
            scene.add(tree);
        });

        rightPositions.forEach((z) => {
            const tree = createTree(THREE);
            tree.position.set(6, 0, z); // côté droit
            scene.add(tree);
        });

        // Bench Position on the left
        createVoxelBench(scene, -6, -4, Math.PI / 2);
        createVoxelBench(scene, -6, 4, Math.PI / 2);

        // Bench Position on the right
        createVoxelBench(scene, 6, -4, -Math.PI / 2);
        createVoxelBench(scene, 6, 4, -Math.PI / 2);

        // Création des joueurs
        const { playersTeam1, playersTeam2 } = createPlayers(scene);
        const allPlayers = [...playersTeam1, ...playersTeam2];

        // État de la caméra première personne
        const firstPersonState: FirstPersonCameraState = {
            enabled: false,
            targetPlayer: null,
            controls: controls,
            yaw: 0,
            pitch: 0,
            sensitivity: 0.002
        };

        // Création de la balle
        const ball = createBall(scene);

        // Initialisation de l'animation
        let t = 0;
        let legSpeed = CROSS_SPEED;
        let fromGroup = findSetter(playersTeam2)!;
        let toGroup = findSetter(playersTeam1)!;

        const tmpFrom = new THREE.Vector3();
        const tmpTo = new THREE.Vector3();

        // Initialisation de la position de la balle
        fromGroup.getWorldPosition(tmpFrom);
        ball.position.set(tmpFrom.x, PLAYER_THROW_HEIGHT, tmpFrom.z);

        // État du jeu
        const gameState: GameState = {
            lastTeam: getTeamSide(fromGroup, playersTeam1, playersTeam2),
            touchCount: 0,
            forceCross: false,
            legType: 'cross'
        };

        const clock = new THREE.Clock();

        // Boucle d'animation
        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            animateSun(delta);

            t += legSpeed;
            if (t >= 1) {
                t = 0;
                fromGroup = toGroup;

                updateGameState(fromGroup, gameState, playersTeam1, playersTeam2);

                const next = selectNextReceiver(fromGroup, gameState, playersTeam1, playersTeam2);
                toGroup = next.toGroup;
                legSpeed = next.legSpeed;
                gameState.legType = next.legType;
            }

            fromGroup.getWorldPosition(tmpFrom);
            toGroup.getWorldPosition(tmpTo);

            const { position: targetPos, throwHeight, arcHeight } = getBallTargetPosition(
                toGroup,
                gameState.legType,
                tmpTo
            );

            updateBallPosition(ball, tmpFrom, targetPos, t, throwHeight, arcHeight);

            playersTeam1.forEach(updateJump);
            playersTeam2.forEach(updateJump);
            playersTeam1.forEach(updateReturnHome);
            playersTeam2.forEach(updateReturnHome);

            updateFirstPersonCamera(camera, firstPersonState);

            if (!firstPersonState.enabled) {
                controls.update();
            }
            renderer.render(scene, camera);
        };
        animate();

        // Gestion du redimensionnement
        const removeResizeHandler = setupResizeHandler(currentMount, camera, renderer);

        // Gestion des contrôles clavier pour la vue première personne
        let currentPlayerIndex = 0;
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'v' || event.key === 'V') {
                toggleFirstPersonView(camera, firstPersonState, controls, allPlayers, renderer);
                if (firstPersonState.enabled && firstPersonState.targetPlayer) {
                    currentPlayerIndex = allPlayers.indexOf(firstPersonState.targetPlayer);
                }
            } else if (firstPersonState.enabled) {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    if (event.key === 'ArrowLeft') {
                        currentPlayerIndex = (currentPlayerIndex - 1 + allPlayers.length) % allPlayers.length;
                    } else {
                        currentPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
                    }
                    switchToPlayer(camera, firstPersonState, allPlayers[currentPlayerIndex]);
                } else if (event.key >= '1' && event.key <= '9') {
                    const index = parseInt(event.key) - 1;
                    if (index < allPlayers.length) {
                        currentPlayerIndex = index;
                        switchToPlayer(camera, firstPersonState, allPlayers[index]);
                    }
                }
            }
        };

        // Gestion des mouvements de la souris pour la vue première personne
        const handleMouseMoveEvent = (event: MouseEvent) => {
            handleMouseMove(event, firstPersonState, renderer);
        };

        // Gestion de la libération du pointer lock
        const handlePointerLockChange = () => {
            if (document.pointerLockElement !== renderer.domElement && firstPersonState.enabled) {
                firstPersonState.enabled = false;
                firstPersonState.targetPlayer = null;
                controls.enabled = true;
            }
        };

        // Gestion du clic pour activer le pointer lock en mode première personne
        const handleCanvasClick = () => {
            if (firstPersonState.enabled && document.pointerLockElement !== renderer.domElement) {
                renderer.domElement.requestPointerLock();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        document.addEventListener('mousemove', handleMouseMoveEvent);
        document.addEventListener('pointerlockchange', handlePointerLockChange);
        renderer.domElement.addEventListener('click', handleCanvasClick);

        // Nettoyage
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            document.removeEventListener('mousemove', handleMouseMoveEvent);
            document.removeEventListener('pointerlockchange', handlePointerLockChange);
            renderer.domElement.removeEventListener('click', handleCanvasClick);
            document.exitPointerLock();
            removeResizeHandler();
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
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