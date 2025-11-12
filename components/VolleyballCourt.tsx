import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createSceneSetup, setupResizeHandler } from './scene/SceneSetup';
import { createCourtElements } from './court/CourtElements';
import { createPlayers } from './players/Player';
import { updateJump, updateReturnHome } from './players/PlayerAnimations';
import { findSetter, getTeamSide } from './game/GameHelpers';
import { GameState, selectNextReceiver, updateGameState, getBallTargetPosition } from './game/GameLogic';
import { createBall, updateBallPosition } from './animation/BallAnimation';

const PLAYER_THROW_HEIGHT = 1.6;
const CROSS_SPEED = 0.01;

const VolleyballCourt: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const currentMount = mountRef.current;

        // Configuration de la scène
        const { scene, camera, renderer, controls } = createSceneSetup(currentMount);

        // Création des éléments du terrain
        const { sandTexture, lineGeometry, lineMaterial } = createCourtElements(scene);

        // Création des joueurs
        const { playersTeam1, playersTeam2 } = createPlayers(scene);

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

        // Boucle d'animation
        const animate = () => {
            requestAnimationFrame(animate);

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

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Gestion du redimensionnement
        const removeResizeHandler = setupResizeHandler(currentMount, camera, renderer);

        // Nettoyage
        return () => {
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