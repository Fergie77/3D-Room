// Third-party imports
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Local imports
import { animateCameraTo } from './cameraAnimation.js'
import { initCameraHelperUI } from './CameraHelperUI.js'
import { cameraStates } from './cameraStates.js'
import { CardParagraphController } from './cardParagraphController.js'
import { createCeiling, createArchCircle } from './ceiling.js'
import { createFloor } from './floor.js'
import { setupLighting } from './lighting.js'
import { loadBikeModel } from './modelLoader.js'
import { VideoScreen } from './videoScreen.js'
import './loadingOverlay.js'

// Initialize video loading counter
window.activeVideoLoads = 0

// Example paragraphs for each room
const paragraphs = {
  0: 'Taking over Aures London, we used 270-degree screens to craft a truly immersive experience - capturing the essence of the urban landscapes where the Flying Flea thrives as a modern city bike and personifying the feeling of driving it. Visually articulating a feeling of lightness, of being in a flow state with a new generation of electric motorcycle.',
  1: "Our night began by transporting guests around the world, plunging them into the core brand cities of London, LA, Delhi and Tokyo. Full room projections of nuanced and well researched footage built a visually rich tapestry of life in the city. Busy streets, Chinatown, the bustle of Soho and independent cafes in London while the dimly lit backstreet izakayas contrasted the overwhelming neon signage of Tokyo's Akihabara district.",
  2: "As the night evolves so did the visuals, perfectly capturing the electrified essence of the Flying Flea. Pulsing animations incorporated design cues from the bike itself and subtly signal brand language. This wasn't just a product reveal - it was a sensory experience, blending visuals and sound to create a festival-like atmosphere, with the Flying Flea as the headline act.",
  3: 'We combined Houdini CGI, 2D animation, and Touch Designer to create over 100 original animated assets for an ever-evolving display that matched the energy of the evening. From the calm, exploratory moments to the exhilarating, high-energy sequences, every visual transition was carefully choreographed to enhance the overall experience.',
}
const cardController = new CardParagraphController(paragraphs)

// Create scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

// Room dimensions
const roomWidth = 4.6666666666
const wallHeight = 2
const roomDepth = 8.8888888888

// Create camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
if (window.innerWidth < 700) {
  camera.position.set(0, -0.3, -4)
} else {
  camera.position.set(0, -0.3, -5)
}

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.outputEncoding = THREE.sRGBEncoding
const mainWrapper = document.querySelector('.main-wrapper')
if (!mainWrapper) {
  console.error('Could not find element with class "main-wrapper"')
} else {
  mainWrapper.appendChild(renderer.domElement)
}

// Add OrbitControls for mouse interaction
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.enablePan = false
controls.enableZoom = false
controls.target.copy(camera.position).add(new THREE.Vector3(0, 0, -1))
controls.update()
controls.rotateSpeed = -0.5
controls.panSpeed = -1

// Initialize camera helper UI
initCameraHelperUI(controls)

// --- Cube Camera for dynamic reflection ---
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
  format: THREE.RGBAFormat,
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
})
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget)
scene.add(cubeCamera)

// --- Floor ---
const textureScale = 0.3
const floor = createFloor(
  roomWidth,
  roomDepth,
  wallHeight,
  cubeRenderTarget,
  textureScale
)
scene.add(floor)

// --- Ceiling and Arch Circles ---
const ceilingSegments = 64
const ceiling = createCeiling(
  roomWidth,
  roomDepth,
  wallHeight,
  cubeRenderTarget,
  ceilingSegments
)
scene.add(ceiling)
const archCircle = createArchCircle(
  roomWidth,
  roomDepth,
  wallHeight,
  cubeRenderTarget,
  ceilingSegments,
  true
)
scene.add(archCircle)
const backArchCircle = createArchCircle(
  roomWidth,
  roomDepth,
  wallHeight,
  cubeRenderTarget,
  ceilingSegments,
  false
)
scene.add(backArchCircle)

// --- Lighting ---
setupLighting(scene)

// --- Video Screens ---
const leftWallVideos = [
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_1/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_4/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_2/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_3/SIDE.mp4',
]
const rightWallVideos = [
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_1/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_4/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_2/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_3/SIDE.mp4',
]
const frontWallVideos = [
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_1/CENTRE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_4/CENTRE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_2/CENTRE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_3/CENTRE.mp4',
]
const leftWall = new VideoScreen(
  roomDepth,
  wallHeight,
  [-(roomWidth / 2), 0, -roomDepth / 2],
  [0, Math.PI / 2, 0],
  leftWallVideos
).getMesh()
const rightWall = new VideoScreen(
  roomDepth,
  wallHeight,
  [roomWidth / 2, 0, -roomDepth / 2],
  [0, Math.PI / 2, 0],
  rightWallVideos
).getMesh()
const frontWall = new VideoScreen(
  roomWidth,
  wallHeight,
  [0, 0, -roomDepth],
  [0, 0, 0],
  frontWallVideos
).getMesh()
scene.add(leftWall)
scene.add(rightWall)
scene.add(frontWall)
const backWallVideos = frontWallVideos
const backWall = new VideoScreen(
  roomWidth,
  wallHeight,
  [0, 0, 0],
  [0, Math.PI, 0],
  backWallVideos
).getMesh()
scene.add(backWall)

// --- OBJ + MTL Model Loader ---
const bikeGlossiness = 0.1
loadBikeModel(scene, cubeRenderTarget, wallHeight, roomDepth, bikeGlossiness)

// Enable shadows in renderer
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Animation loop
let lastTime = 0
function animate(time) {
  const deltaTime = (time - lastTime) / 1000
  lastTime = time
  requestAnimationFrame(animate)
  controls.update()
  const leftScreen = leftWall.userData.videoScreen
  const rightScreen = rightWall.userData.videoScreen
  const frontScreen = frontWall.userData.videoScreen
  const backScreen = backWall.userData.videoScreen
  if (leftScreen) leftScreen.update(deltaTime)
  if (rightScreen) rightScreen.update(deltaTime)
  if (frontScreen) frontScreen.update(deltaTime)
  if (backScreen) backScreen.update(deltaTime)
  floor.visible = false
  cubeCamera.position.copy(floor.position)
  cubeCamera.update(renderer, scene)
  floor.visible = true
  renderer.render(scene, camera)
}

// Camera state logic
const initialState = cameraStates[0]
camera.position.copy(initialState.position)
camera.rotation.copy(initialState.rotation)

// Track current room state
let currentRoomIndex = 0

// Function to handle room transitions
async function transitionToRoom(targetIndex) {
  const leftScreen = leftWall.userData.videoScreen
  const rightScreen = rightWall.userData.videoScreen
  const frontScreen = frontWall.userData.videoScreen
  const backScreen = backWall.userData.videoScreen

  async function safeGoTo(screen, targetIndex) {
    if (screen && screen.currentVideoIndex !== targetIndex) {
      await screen.goToVideo(targetIndex)
      const video = screen.planes[0]?.userData?.video
      if (video && video.paused) {
        try {
          await video.play()
        } catch (e) {
          alert('Please tap again to enable video playback.')
        }
      }
    }
  }

  if (cameraStates[targetIndex]) {
    animateCameraTo(cameraStates[targetIndex], camera, controls)
  }

  await Promise.all([
    safeGoTo(leftScreen, targetIndex),
    safeGoTo(rightScreen, targetIndex),
    safeGoTo(frontScreen, targetIndex),
    safeGoTo(backScreen, targetIndex),
  ])

  // Update the card paragraph
  cardController.setRoom(targetIndex)
  currentRoomIndex = targetIndex
}

// Handle pulse-icon clicks for mobile cycling
document.querySelector('.pulse-icon')?.addEventListener('click', () => {
  const nextRoomIndex =
    (currentRoomIndex + 1) % Object.keys(cameraStates).length
  transitionToRoom(nextRoomIndex)
})

// Handle data-room clicks
document.addEventListener('click', async (event) => {
  const roomElement = event.target.closest('[data-room]')
  if (!roomElement) return

  const roomType = roomElement.getAttribute('data-room')
  const targetIndex = parseInt(roomType) - 1
  transitionToRoom(targetIndex)
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
})

animate()
