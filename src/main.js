import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ReflectorForSSRPass } from 'three/examples/jsm/objects/ReflectorForSSRPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js'

// Create scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

// Create camera
const camera = new THREE.PerspectiveCamera(
  75, // fov
  window.innerWidth / window.innerHeight, // aspect
  0.1, // near
  1000 // far
)
camera.position.set(0, 0, -1) // Place camera inside the room, looking at the front wall

// Create renderer
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputEncoding = THREE.sRGBEncoding
document.body.appendChild(renderer.domElement)

// Add OrbitControls for mouse interaction
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.enablePan = true
controls.enableZoom = true
controls.target.set(0, 0, -2)
controls.update()

// Helper to create a colored plane
// function createColorPlane(color, width, height, position, rotation) {
//   const material = new THREE.MeshBasicMaterial({
//     color,
//     side: THREE.DoubleSide,
//   })
//   const geometry = new THREE.PlaneGeometry(width, height)
//   const mesh = new THREE.Mesh(geometry, material)
//   mesh.position.set(...position)
//   if (rotation) mesh.rotation.set(...rotation)
//   return mesh
// }

// Helper to create a video plane (generalized for any video src)
function createVideoPlaneFromSrc(videoSrc, width, height, position, rotation) {
  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.src = videoSrc
  video.autoplay = true
  video.muted = true
  video.loop = true
  video.playsInline = true
  video.style.display = 'none'
  document.body.appendChild(video)

  // Explicitly try to play the video
  video.play().catch((e) => {
    console.warn('Autoplay prevented:', e)
  })

  const texture = new THREE.VideoTexture(video)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  })
  const geometry = new THREE.PlaneGeometry(width, height)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  if (rotation) mesh.rotation.set(...rotation)
  return mesh
}

// Room dimensions
const roomWidth = 4 // distance between left and right walls
const wallHeight = 1.5
const roomDepth = 4 // distance from camera to front wall

// Create three colored planes as walls
const leftWall = createVideoPlaneFromSrc(
  'https://tg-3d-room.netlify.app/FF_PS_02_L_R.mp4',
  roomDepth,
  wallHeight,
  [-(roomWidth / 2), 0, -roomDepth / 2],
  [0, Math.PI / 2, 0]
)
const rightWall = createVideoPlaneFromSrc(
  'https://tg-3d-room.netlify.app/FF_PS_02_L_R.mp4',
  roomDepth,
  wallHeight,
  [roomWidth / 2, 0, -roomDepth / 2],
  [0, -Math.PI / 2, 0]
)
const frontWall = createVideoPlaneFromSrc(
  'https://tg-3d-room.netlify.app/FF_PS_02_C_1.mp4',
  roomWidth,
  wallHeight,
  [0, 0, -roomDepth],
  [0, 0, 0]
)

scene.add(leftWall)
scene.add(rightWall)
scene.add(frontWall)

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(0, 5, 5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
directionalLight.shadow.camera.near = 0.5
directionalLight.shadow.camera.far = 20
scene.add(directionalLight)

// Add a floor using ReflectorForSSRPass
const floorTexture = new THREE.TextureLoader().load('/public/RoughnessMap.jpg')
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(2, 2) // Adjust tiling as needed

const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth)
const floor = new ReflectorForSSRPass(floorGeometry, {
  clipBias: 1,
  textureWidth: window.innerWidth,
  textureHeight: window.innerHeight,
  color: 0x000000,
  useDepthTexture: true,
  distanceAttenuation: true,
  maxDistance: 0.001,
  map: floorTexture,
})
floor.material.depthWrite = false
floor.rotation.x = -Math.PI / 2
floor.position.y = -(wallHeight / 2)
floor.position.z = -roomDepth / 2
scene.add(floor)

// Add a ceiling
const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth)
const ceilingMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  side: THREE.DoubleSide,
})
const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
ceiling.rotation.x = Math.PI / 2
ceiling.position.y = wallHeight / 2
ceiling.position.z = -roomDepth / 2
ceiling.receiveShadow = true
scene.add(ceiling)

// Add a sphere
const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32)
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
sphere.position.set(-0.8, -wallHeight / 2 + 0.3, -roomDepth / 1.5)
sphere.castShadow = true
sphere.receiveShadow = true
scene.add(sphere)

// Add a cube
const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
cube.position.set(0.8, -wallHeight / 2 + 0.25, -roomDepth / 1.5)
cube.castShadow = true
cube.receiveShadow = true
scene.add(cube)

// Enable shadows in renderer
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Set up EffectComposer
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

// Set up SSRPass
const ssrPass = new SSRPass({
  renderer,
  scene,
  camera,
  width: window.innerWidth,
  height: window.innerHeight,
  groundReflector: floor,
  distanceAttenuation: true,
  selects: [floor],
  thickness: 0.018,
  maxDistance: 0.001,
  //minDistance: 0.001,
  blur: true,
})
composer.addPass(ssrPass)

// After SSRPass and floor creation
ssrPass.distanceAttenuation = true
floor.distanceAttenuation = ssrPass.distanceAttenuation

// Utility function to set maxDistance on both SSRPass and floor
function setReflectionMaxDistance(value) {
  ssrPass.maxDistance = value
  floor.maxDistance = value
}

// Set initial maxDistance
setReflectionMaxDistance(10) // You can change this value as needed

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  composer.render()
}

animate()
