import { gsap } from 'gsap'
export function animateCameraTo(state, camera, controls) {
  gsap.to(camera.position, {
    x: state.position.x,
    y: state.position.y,
    z: state.position.z,
    duration: 2,
    ease: 'ease.inOut',
    onUpdate: () => {
      camera.updateProjectionMatrix()
      controls.update()
    },
  })
  gsap.to(camera.rotation, {
    x: state.rotation.x,
    y: state.rotation.y,
    z: state.rotation.z,
    duration: 2,
    ease: 'ease.inOut',
    onUpdate: () => {
      camera.updateProjectionMatrix()
      controls.update()
    },
  })
}
