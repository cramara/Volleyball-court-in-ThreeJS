import * as THREE from 'three';

export const startJump = (player: THREE.Group) => {
    player.userData.jump = player.userData.jump || {};
    player.userData.jump.phase = 0;
    player.userData.jump.active = true;
    player.userData.jump.height = 0.5;
};

export const updateJump = (player: THREE.Group) => {
    if (!player.userData.jump || !player.userData.jump.active) return;
    player.userData.jump.phase += 0.08;
    const p = player.userData.jump.phase;
    if (p >= 1) {
        player.userData.jump.active = false;
        player.position.y = 0;
        if (player.userData.returnHomeAfterJump && player.userData.home) {
            player.userData.returnHomeAfterJump = false;
            if (typeof player.userData.returnHomeDelay !== 'number') {
                player.userData.returnHomeDelay = 20;
            }
        }
        return;
    }
    const y = Math.sin(Math.PI * p) * player.userData.jump.height;
    player.position.y = y;
};

export const updateReturnHome = (player: THREE.Group) => {
    if (!player.userData || !player.userData.home) return;

    if (typeof player.userData.returnHomeDelay === 'number' && player.userData.returnHomeDelay > 0) {
        player.userData.returnHomeDelay -= 1;
        if (player.userData.returnHomeDelay <= 0) {
            player.userData.returnHome = true;
        } else {
            return;
        }
    }

    if (!player.userData.returnHome) return;
    const hx = player.userData.home.x;
    const hz = player.userData.home.z;
    const alpha = 0.06;
    player.position.x += (hx - player.position.x) * alpha;
    player.position.z += (hz - player.position.z) * alpha;
    const dx = hx - player.position.x;
    const dz = hz - player.position.z;
    if (Math.hypot(dx, dz) < 0.05) {
        player.position.x = hx;
        player.position.z = hz;
        player.userData.returnHome = false;
    }
};

