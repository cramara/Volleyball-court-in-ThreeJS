import * as THREE from 'three';
import { PlayerRole, TeamSide } from '../players/Player';

export const pickRandom = (arr: THREE.Group[]): THREE.Group => {
    return arr[Math.floor(Math.random() * arr.length)];
};

export const pickRandomDifferent = (arr: THREE.Group[], exclude: THREE.Group): THREE.Group => {
    const candidates = arr.filter(g => g !== exclude);
    return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : exclude;
};

export const isInTeam = (player: THREE.Group, team: THREE.Group[]): boolean => {
    return team.includes(player);
};

export const getTeamSide = (player: THREE.Group, playersTeam1: THREE.Group[], playersTeam2: THREE.Group[]): TeamSide => {
    return isInTeam(player, playersTeam1) ? 'team1' : 'team2';
};

export const getRole = (player: THREE.Group): PlayerRole => {
    return player.userData.role;
};

export const getTeamArray = (side: TeamSide, playersTeam1: THREE.Group[], playersTeam2: THREE.Group[]): THREE.Group[] => {
    return side === 'team1' ? playersTeam1 : playersTeam2;
};

export const getOppTeamArray = (side: TeamSide, playersTeam1: THREE.Group[], playersTeam2: THREE.Group[]): THREE.Group[] => {
    return side === 'team1' ? playersTeam2 : playersTeam1;
};

export const findSetter = (teamArr: THREE.Group[]): THREE.Group | undefined => {
    return teamArr.find(g => g.userData.role === 'passeur');
};

export const findAttackers = (teamArr: THREE.Group[]): THREE.Group[] => {
    return teamArr.filter(g => g.userData.role === 'attaquant');
};

export const getSetTargetForAttacker = (attacker: THREE.Group, playersTeam1: THREE.Group[], playersTeam2: THREE.Group[]): THREE.Vector3 => {
    const side = getTeamSide(attacker, playersTeam1, playersTeam2);
    const netZ = side === 'team1' ? 0.25 : -0.25;
    return new THREE.Vector3(attacker.position.x, 0, netZ);
};

