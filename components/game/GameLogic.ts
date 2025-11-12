import * as THREE from 'three';
import { PlayerRole, TeamSide } from '../players/Player';
import {
    pickRandom,
    pickRandomDifferent,
    getTeamSide,
    getRole,
    getTeamArray,
    getOppTeamArray,
    findSetter,
    findAttackers,
    getSetTargetForAttacker
} from './GameHelpers';
import { startJump } from '../players/PlayerAnimations';
import { NET_HEIGHT } from '../../constants';

export interface GameState {
    lastTeam: TeamSide;
    touchCount: number;
    forceCross: boolean;
    legType: 'cross' | 'pass' | 'setToAttacker';
}

export const selectNextReceiver = (
    fromGroup: THREE.Group,
    gameState: GameState,
    playersTeam1: THREE.Group[],
    playersTeam2: THREE.Group[]
): { toGroup: THREE.Group; legSpeed: number; legType: 'cross' | 'pass' | 'setToAttacker' } => {
    const currentTeamSide = getTeamSide(fromGroup, playersTeam1, playersTeam2);
    const teamArr = getTeamArray(currentTeamSide, playersTeam1, playersTeam2);
    const oppArr = getOppTeamArray(currentTeamSide, playersTeam1, playersTeam2);
    const setter = findSetter(teamArr);
    const attackers = findAttackers(teamArr);

    const CROSS_SPEED = 0.01;
    const PASS_SPEED = 0.013;

    if (gameState.forceCross) {
        const toGroup = pickRandom(oppArr);
        gameState.forceCross = false;
        if (fromGroup.userData) {
            fromGroup.userData.state = 'idle';
            if (fromGroup.userData.home) {
                fromGroup.userData.returnHomeAfterJump = true;
                fromGroup.userData.returnHomeDelay = 150;
                delete fromGroup.userData.runTarget;
            }
        }
        return { toGroup, legSpeed: CROSS_SPEED, legType: 'cross' };
    }

    if (gameState.touchCount === 1) {
        if (getRole(fromGroup) === 'passeur') {
            const attacker = pickRandom(attackers);
            if (attacker) {
                attacker.userData.state = 'attaque';
                gameState.forceCross = true;
                const runTarget = getSetTargetForAttacker(attacker, playersTeam1, playersTeam2);
                attacker.userData.runTarget = { x: runTarget.x, z: runTarget.z };
                return { toGroup: attacker, legSpeed: PASS_SPEED, legType: 'setToAttacker' };
            } else {
                return { toGroup: pickRandom(oppArr), legSpeed: CROSS_SPEED, legType: 'cross' };
            }
        } else {
            const toGroup = setter ?? pickRandomDifferent(teamArr, fromGroup);
            return { toGroup, legSpeed: PASS_SPEED, legType: 'pass' };
        }
    } else if (gameState.touchCount === 2) {
        if (getRole(fromGroup) === 'passeur') {
            const attacker = pickRandom(attackers);
            if (attacker) {
                attacker.userData.state = 'attaque';
                gameState.forceCross = true;
                const runTarget = getSetTargetForAttacker(attacker, playersTeam1, playersTeam2);
                attacker.userData.runTarget = { x: runTarget.x, z: runTarget.z };
                return { toGroup: attacker, legSpeed: PASS_SPEED, legType: 'setToAttacker' };
            } else {
                gameState.touchCount = 0;
                return { toGroup: pickRandom(oppArr), legSpeed: CROSS_SPEED, legType: 'cross' };
            }
        } else {
            gameState.touchCount = 0;
            startJump(fromGroup);
            return { toGroup: pickRandom(oppArr), legSpeed: CROSS_SPEED, legType: 'cross' };
        }
    } else {
        gameState.touchCount = 0;
        return { toGroup: pickRandom(oppArr), legSpeed: CROSS_SPEED, legType: 'cross' };
    }
};

export const updateGameState = (
    fromGroup: THREE.Group,
    gameState: GameState,
    playersTeam1: THREE.Group[],
    playersTeam2: THREE.Group[]
): void => {
    const currentTeamSide = getTeamSide(fromGroup, playersTeam1, playersTeam2);
    
    if (gameState.lastTeam === currentTeamSide) {
        gameState.touchCount += 1;
    } else {
        gameState.touchCount = 1;
    }
    
    gameState.lastTeam = currentTeamSide;

    if (fromGroup.userData && fromGroup.userData.state === 'attaque') {
        startJump(fromGroup);
    }

    if (getRole(fromGroup) === 'defenseur') {
        startJump(fromGroup);
    }
};

export const getBallTargetPosition = (
    toGroup: THREE.Group,
    legType: 'cross' | 'pass' | 'setToAttacker',
    tmpTo: THREE.Vector3
): { position: THREE.Vector3; throwHeight: number; arcHeight: number } => {
    const PLAYER_THROW_HEIGHT = 1.6;
    const ARC_HEIGHT = 0.8;
    
    let throwHeight = PLAYER_THROW_HEIGHT;
    let arcHeight = ARC_HEIGHT;

    if (legType === 'setToAttacker' && toGroup.userData && toGroup.userData.runTarget) {
        const rt = toGroup.userData.runTarget;
        tmpTo.x = rt.x;
        tmpTo.z = rt.z;
        throwHeight = NET_HEIGHT - 0.2;
        arcHeight = 0.25;

        const dx = rt.x - toGroup.position.x;
        const dz = rt.z - toGroup.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.02) {
            const moveAlpha = 0.01;
            toGroup.position.x += dx * moveAlpha;
            toGroup.position.z += dz * moveAlpha;
        } else {
            toGroup.position.x = rt.x;
            toGroup.position.z = rt.z;
        }
    }

    tmpTo.y = throwHeight;
    return { position: tmpTo.clone(), throwHeight, arcHeight };
};

