import * as THREE from 'three';
import { BALL_RADIUS } from '../../constants';

export const createBall = (scene: THREE.Scene): THREE.Mesh => {
    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.2 });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);
    return ball;
};

export const updateBallPosition = (
    ball: THREE.Mesh,
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    t: number,
    throwHeight: number,
    arcHeight: number
): void => {
    fromPos.y = throwHeight;
    toPos.y = throwHeight;

    const tmpPos = new THREE.Vector3();
    tmpPos.lerpVectors(fromPos, toPos, t);
    const arc = Math.sin(Math.PI * t) * arcHeight;
    ball.position.set(tmpPos.x, tmpPos.y + arc, tmpPos.z);

    ball.rotation.x += 0.02;
    ball.rotation.y += 0.015;
};

