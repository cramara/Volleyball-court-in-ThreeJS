import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface FirstPersonCameraState {
    enabled: boolean;
    targetPlayer: THREE.Group | null;
    controls: OrbitControls | null;
    yaw: number;
    pitch: number;
    sensitivity: number;
}

export const calculateHeadPosition = (player: THREE.Group): THREE.Vector3 => {
    const headPosition = new THREE.Vector3();
    const headOffset = new THREE.Vector3();
    
    player.getWorldPosition(headPosition);
    
    const head = player.children.find(child => 
        child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.SphereGeometry
    ) as THREE.Mesh | undefined;
    
    if (head) {
        head.getWorldPosition(headOffset);
        return headOffset;
    }
    
    headPosition.y += 1.24;
    return headPosition;
};

export const updateFirstPersonCamera = (
    camera: THREE.PerspectiveCamera,
    state: FirstPersonCameraState
): void => {
    if (!state.enabled || !state.targetPlayer) return;

    const headPos = calculateHeadPosition(state.targetPlayer);
    camera.position.copy(headPos);

    const euler = new THREE.Euler(state.pitch, state.yaw, 0, 'YXZ');
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(euler);
    
    const lookAt = headPos.clone().add(direction);
    camera.lookAt(lookAt);
};

export const handleMouseMove = (
    event: MouseEvent,
    state: FirstPersonCameraState,
    renderer: THREE.WebGLRenderer
): void => {
    if (!state.enabled) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    state.yaw -= movementX * state.sensitivity;
    state.pitch -= movementY * state.sensitivity;

    const maxPitch = Math.PI / 2 - 0.1;
    state.pitch = Math.max(-maxPitch, Math.min(maxPitch, state.pitch));
};

export const toggleFirstPersonView = (
    camera: THREE.PerspectiveCamera,
    state: FirstPersonCameraState,
    controls: OrbitControls,
    players: THREE.Group[],
    renderer: THREE.WebGLRenderer
): void => {
    if (state.enabled) {
        state.enabled = false;
        state.targetPlayer = null;
        controls.enabled = true;
        document.exitPointerLock();
    } else {
        if (players.length === 0) return;
        
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        state.enabled = true;
        state.targetPlayer = randomPlayer;
        controls.enabled = false;
        
        const playerRotation = randomPlayer.rotation.y;
        state.yaw = playerRotation + Math.PI;
        state.pitch = 0;
        
        const headPos = calculateHeadPosition(randomPlayer);
        camera.position.copy(headPos);
        
        renderer.domElement.requestPointerLock();
    }
};

export const switchToPlayer = (
    camera: THREE.PerspectiveCamera,
    state: FirstPersonCameraState,
    player: THREE.Group
): void => {
    if (!state.enabled) return;
    state.targetPlayer = player;
    const playerRotation = player.rotation.y;
    state.yaw = playerRotation + Math.PI;
    const headPos = calculateHeadPosition(player);
    camera.position.copy(headPos);
};

