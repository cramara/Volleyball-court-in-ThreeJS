import * as THREE from 'three';

export type PlayerRole = 'passeur' | 'attaquant' | 'defenseur';
export type TeamSide = 'team1' | 'team2';

export interface PlayerPosition {
    x: number;
    z: number;
    role: PlayerRole;
}

export const createPlayer = (
    x: number,
    z: number,
    teamColor: number,
    role: PlayerRole,
    team: TeamSide
): THREE.Group => {
    const playerGroup = new THREE.Group();
    playerGroup.userData = { role, team, state: 'idle', home: { x, z }, returnHome: false };

    const bodyRadius = 0.16;
    const shortHeight = 0.30;
    const shortCenterY = 0.45;
    const jerseyHeight = 0.80;
    const jerseyCenterY = shortHeight + jerseyHeight / 2;

    // Torse (cylindre) + maillot
    const jerseyGeometry = new THREE.CylinderGeometry(bodyRadius, bodyRadius, jerseyHeight, 20);
    const jerseyMaterial = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.6, metalness: 0.05 });
    const jersey = new THREE.Mesh(jerseyGeometry, jerseyMaterial);
    jersey.position.y = jerseyCenterY;
    jersey.castShadow = true;
    jersey.receiveShadow = true;
    playerGroup.add(jersey);

    // Short (cylindre plus sombre)
    const shortGeometry = new THREE.CylinderGeometry(bodyRadius * 1.05, bodyRadius * 1.05, shortHeight, 18);
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
    head.position.y = jerseyCenterY + jerseyHeight / 2 + headRadius + 0.02;
    head.castShadow = true;
    head.receiveShadow = true;
    playerGroup.add(head);

    // Arms (cylinders)
    const armLength = 0.45;
    const armRadius = 0.05;
    const armGeometry = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.rotation.z = Math.PI / 2;
    leftArm.position.set(-bodyRadius - armLength / 2, jerseyCenterY + 0.20, 0);
    leftArm.castShadow = true;
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.rotation.z = -Math.PI / 2;
    rightArm.position.set(bodyRadius + armLength / 2, jerseyCenterY + 0.20, 0);
    rightArm.castShadow = true;
    playerGroup.add(rightArm);

    // Legs (cylinders)
    const legLength = 0.40;
    const legRadius = 0.07;
    const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legLength, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.9 });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-bodyRadius * 0.7, legLength / 2, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);

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
    sleeveL.position.set(-bodyRadius - 0.2, jerseyCenterY + 0.20, 0);
    const sleeveR = new THREE.Mesh(sleeveGeometry, sleeveMat);
    sleeveR.rotation.z = -Math.PI / 2;
    sleeveR.position.set(bodyRadius + 0.2, jerseyCenterY + 0.20, 0);
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
        playerGroup.rotation.y = team === 'team1' ? 0 : Math.PI;
    }
    else {
        playerGroup.rotation.y = team === 'team1' ? Math.PI : 0;
    }

    return playerGroup;
};

export const createPlayers = (scene: THREE.Scene) => {
    const team1Color = 0x0066ff;
    const team1Positions: PlayerPosition[] = [
        { x: -2.5, z: 3.8, role: 'attaquant' },
        { x: 0.0, z: 3.0, role: 'passeur' },
        { x: 2.5, z: 3.8, role: 'attaquant' },
        { x: -2.5, z: 6.5, role: 'defenseur' },
        { x: 0.0, z: 6.5, role: 'defenseur' },
        { x: 2.5, z: 6.5, role: 'defenseur' }
    ];
    const playersTeam1 = team1Positions.map(p => createPlayer(p.x, p.z, team1Color, p.role, 'team1'));
    playersTeam1.forEach(player => scene.add(player));

    const team2Color = 0xff3333;
    const team2Positions: PlayerPosition[] = [
        { x: -2.5, z: -3.8, role: 'attaquant' },
        { x: 0.0, z: -3.0, role: 'passeur' },
        { x: 2.5, z: -3.8, role: 'attaquant' },
        { x: -2.5, z: -6.5, role: 'defenseur' },
        { x: 0.0, z: -6.5, role: 'defenseur' },
        { x: 2.5, z: -6.5, role: 'defenseur' }
    ];
    const playersTeam2 = team2Positions.map(p => createPlayer(p.x, p.z, team2Color, p.role, 'team2'));
    playersTeam2.forEach(player => scene.add(player));

    return { playersTeam1, playersTeam2 };
};

