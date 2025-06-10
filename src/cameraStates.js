import * as THREE from 'three'

export const degToRad = (deg) => (deg * Math.PI) / 180
const isMobile = window.innerWidth < 700
const initialPosition = isMobile
  ? new THREE.Vector3(0, -0.3, -4)
  : new THREE.Vector3(0, -0.3, -5)
export const cameraStates = {
  0: {
    position: initialPosition,
    rotation: new THREE.Euler(0, 0, 0),
  },
  1: {
    position: new THREE.Vector3(-0.81, -0.36, -1.63),
    rotation: new THREE.Euler(degToRad(5.3), degToRad(-38.0), degToRad(3.3)),
  },
  2: {
    position: new THREE.Vector3(1.57, -0.5, -3.31),
    rotation: new THREE.Euler(
      degToRad(148.9),
      degToRad(72.9),
      degToRad(-150.0)
    ),
  },
  3: {
    position: new THREE.Vector3(-0.36, -0.08, -7.99),
    rotation: new THREE.Euler(degToRad(179.4), degToRad(-3.0), degToRad(180.0)),
  },
}
