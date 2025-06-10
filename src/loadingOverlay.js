import { gsap } from 'gsap'
const loadingOverlay = document.createElement('div')
loadingOverlay.style.position = 'fixed'
loadingOverlay.style.top = '0'
loadingOverlay.style.left = '0'
loadingOverlay.style.width = '100vw'
loadingOverlay.style.height = '100vh'
loadingOverlay.style.background = 'rgba(0,0,0,0.7)'
loadingOverlay.style.display = 'flex'
loadingOverlay.style.justifyContent = 'center'
loadingOverlay.style.alignItems = 'center'
loadingOverlay.style.zIndex = '1000'
loadingOverlay.style.flexDirection = 'column'
loadingOverlay.innerHTML = `<div class="spinner"></div>`
document.body.appendChild(loadingOverlay)
const spinnerStyle = document.createElement('style')
spinnerStyle.innerHTML = `
.spinner {
  width: 48px;
  height: 48px;
  border: 2px solid #fff;
  border-top: 2px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`
document.head.appendChild(spinnerStyle)
export function showGlobalLoading() {
  gsap.to(loadingOverlay, {
    opacity: 1,
    duration: 0.5,
    pointerEvents: 'auto',
    onStart: () => {
      loadingOverlay.style.pointerEvents = 'auto'
    },
  })
}
export function hideGlobalLoading() {
  loadingOverlay.style.pointerEvents = 'none'
  gsap.to(loadingOverlay, {
    opacity: 0,
    duration: 0.5,
  })
}
window.showGlobalLoading = showGlobalLoading
window.hideGlobalLoading = hideGlobalLoading
