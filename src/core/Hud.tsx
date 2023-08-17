import { Portal, T, useFrame, useThree } from '@solid-three/fiber'
import { JSX } from 'solid-js'
import * as THREE from 'three'
import { defaultProps } from '../helpers/defaultProps'

type RenderHudProps = {
  defaultScene: THREE.Scene
  defaultCamera: THREE.Camera
  renderPriority?: number
}

type HudProps = {
  /** Any React node */
  children: JSX.Element
  /** Render priority, default: 1 */
  renderPriority?: number
}

function RenderHud(_props: { defaultScene; defaultCamera; renderPriority }) {
  const props = defaultProps(_props, { renderPriority: 1 })
  const store = useThree()
  let oldClear: boolean
  useFrame(() => {
    oldClear = store.gl.autoClear
    if (props.renderPriority === 1) {
      // Clear scene and render the default scene
      store.gl.autoClear = true
      store.gl.render(props.defaultScene, props.defaultCamera)
    }
    // Disable cleaning and render the portal with its own camera
    store.gl.autoClear = false
    store.gl.clearDepth()
    store.gl.render(store.scene, store.camera)
    // Restore default
    store.gl.autoClear = oldClear
  }, props.renderPriority)
  // Without an element that receives pointer events state.pointer will always be 0/0
  return <T.Group onPointerOver={() => null} />
}

export function Hud(props: HudProps) {
  const store = useThree()
  const hudScene = new THREE.Scene()
  return (
    <Portal container={hudScene} state={{ events: { priority: (props.renderPriority || 1) + 1 } }}>
      {props.children}
      <RenderHud defaultScene={store.scene} defaultCamera={store.camera} renderPriority={props.renderPriority || 1} />
    </Portal>
  )
}
