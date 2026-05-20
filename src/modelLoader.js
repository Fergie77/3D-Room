import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export function loadBikeModel(
  scene,
  cubeRenderTarget,
  wallHeight,
  roomDepth,
  bikeGlossiness
) {
  const loader = new GLTFLoader()
  loader.load(
    'https://tg-3d-room.netlify.app/FlyingFlea2/Flying_Flea-compressed.glb',
    (gltf) => {
      const object = gltf.scene
      object.position.set(0, -(wallHeight / 2 - 0.41), -roomDepth / 2 - 2)
      object.rotation.set(0, 1.55, 0)
      object.scale.set(1.4, 1.4, 1.4)
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          child.material = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 1,
            roughness: bikeGlossiness,
            envMap: cubeRenderTarget.texture,
            envMapIntensity: 1.0,
          })
        }
      })
      scene.add(object)
      // Mirrored bike on the other side of the room
      const bike2 = object.clone()
      bike2.position.set(0, -(wallHeight / 2 - 0.41), -roomDepth / 2 + 2)
      bike2.rotation.set(0, -1.55, 0)
      scene.add(bike2)
    },
    undefined,
    (err) => console.error('Failed to load bike GLB:', err)
  )
}
