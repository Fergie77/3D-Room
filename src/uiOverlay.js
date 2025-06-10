import * as THREE from 'three'
export function createCameraInfoOverlay(camera) {
  const camInfo = document.createElement('div')
  camInfo.style.position = 'fixed'
  camInfo.style.bottom = '16px'
  camInfo.style.left = '16px'
  camInfo.style.background = 'rgba(0,0,0,0.7)'
  camInfo.style.color = '#fff'
  camInfo.style.fontFamily = 'monospace'
  camInfo.style.fontSize = '14px'
  camInfo.style.padding = '10px 16px'
  camInfo.style.borderRadius = '8px'
  camInfo.style.zIndex = '2000'
  camInfo.style.pointerEvents = 'none'
  document.body.appendChild(camInfo)
  function formatVec3(v) {
    return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`
  }
  function formatEuler(e) {
    return `(${THREE.MathUtils.radToDeg(e.x).toFixed(
      1
    )}°, ${THREE.MathUtils.radToDeg(e.y).toFixed(
      1
    )}°, ${THREE.MathUtils.radToDeg(e.z).toFixed(1)}°)`
  }
  return function updateOverlay() {
    camInfo.innerHTML = `
      <b>Camera Position:</b> ${formatVec3(camera.position)}<br>
      <b>Camera Rotation:</b> ${formatEuler(camera.rotation)}
    `
  }
}
