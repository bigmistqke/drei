import { T, createPortal, useFrame, useThree } from '@solid-three/fiber'
import { createEffect, createSignal, onCleanup, onMount, untrack, type JSX } from 'solid-js'
import * as THREE from 'three'
import { defaultProps } from '../helpers/defaultProps'

const isOrthographicCamera = (def: any): def is THREE.OrthographicCamera =>
  def && (def as THREE.OrthographicCamera).isOrthographicCamera
const col = new THREE.Color()

/**
 * In `@solid-three/fiber` after `v8.0.0` but prior to `v8.1.0`, `state.size` contained only dimension
 * information. After `v8.1.0`, position information (`top`, `left`) was added
 *
 * @todo remove this when drei supports v9 and up
 */
type LegacyCanvasSize = {
  height: number
  width: number
}

type CanvasSize = LegacyCanvasSize & {
  top: number
  left: number
}

function isNonLegacyCanvasSize(size: Record<string, number>): size is CanvasSize {
  return 'top' in size
}

export type ContainerProps = {
  scene: THREE.Scene
  index: number
  children?: JSX.Element
  frames: number
  rect: DOMRect
  track: HTMLElement
  canvasSize: LegacyCanvasSize | CanvasSize
}

export type ViewProps = {
  /** The tracking element, the view will be cut according to its whereabouts */
  track: HTMLElement
  /** Views take over the render loop, optional render index (1 by default) */
  index?: number
  /** If you know your view is always at the same place set this to 1 to avoid needless getBoundingClientRect overhead */
  frames?: number
  /** The scene to render, if you leave this undefined it will render the default scene */
  children?: JSX.Element
}

function computeContainerPosition(
  canvasSize: LegacyCanvasSize | CanvasSize,
  trackRect: DOMRect
): {
  position: CanvasSize & { bottom: number; right: number }
  isOffscreen: boolean
} {
  const { right, top, left: trackLeft, bottom: trackBottom, width, height } = trackRect
  const isOffscreen = trackRect.bottom < 0 || top > canvasSize.height || right < 0 || trackRect.left > canvasSize.width

  if (isNonLegacyCanvasSize(canvasSize)) {
    const canvasBottom = canvasSize.top + canvasSize.height
    const bottom = canvasBottom - trackBottom
    const left = trackLeft - canvasSize.left

    return { position: { width, height, left, top, bottom, right }, isOffscreen }
  }

  // Fall back on old behavior if r3f < 8.1.0
  const bottom = canvasSize.height - trackBottom

  return { position: { width, height, top, left: trackLeft, bottom, right }, isOffscreen }
}

function Container(props: ContainerProps) {
  const store = useThree()

  let frameCount = 0
  useFrame((state) => {
    if (props.frames === Infinity || frameCount <= props.frames) {
      props.rect = props.track.getBoundingClientRect()
      frameCount++
    }

    if (props.rect) {
      const {
        position: { left, bottom, width, height },
        isOffscreen,
      } = computeContainerPosition(props.canvasSize, props.rect)

      const aspect = width / height

      if (isOrthographicCamera(store.camera)) {
        if (
          store.camera.left !== width / -2 ||
          store.camera.right !== width / 2 ||
          store.camera.top !== height / 2 ||
          store.camera.bottom !== height / -2
        ) {
          Object.assign(store.camera, { left: width / -2, right: width / 2, top: height / 2, bottom: height / -2 })
          store.camera.updateProjectionMatrix()
        }
      } else if (store.camera.aspect !== aspect) {
        store.camera.aspect = aspect
        store.camera.updateProjectionMatrix()
      }

      state.gl.setViewport(left, bottom, width, height)
      state.gl.setScissor(left, bottom, width, height)
      state.gl.setScissorTest(true)

      if (isOffscreen) {
        state.gl.getClearColor(col)
        state.gl.setClearColor(col, state.gl.getClearAlpha())
        state.gl.clear(true, true)
      } else {
        // When children are present render the portalled scene, otherwise the default scene
        state.gl.render(props.children ? store.scene : props.scene, store.camera)
      }
      // Restore the default state
      state.gl.setScissorTest(true)
    }
  }, props.index)

  onMount(() => {
    // Connect the event layer to the tracking element
    const old = untrack(() => store.events.connected)
    store.setEvents({ connected: props.track })
    onCleanup(() => store.setEvents({ connected: old }))
  })

  onMount(() => {
    if (isNonLegacyCanvasSize(props.canvasSize)) {
      return
    }
    console.warn(
      'Detected @solid-three/fiber canvas size does not include position information. <View /> may not work as expected. ' +
        'Upgrade to @solid-three/fiber ^8.1.0 for support.\n See https://github.com/pmndrs/drei/issues/944'
    )
  })

  return <>{props.children}</>
}

export const View = (_props: ViewProps) => {
  const props = defaultProps(_props, { index: 1, frames: Infinity })

  let rect: DOMRect = null!
  const store = useThree()
  const virtualScene = new THREE.Scene()

  const compute = (event, state) => {
    if (rect && props.track && event.target === props.track) {
      const { width, height, left, top } = rect
      const x = event.clientX - left
      const y = event.clientY - top
      state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
      state.raycaster.setFromCamera(state.pointer, state.camera)
    }
  }

  const [ready, setReady] = createSignal(false)
  const toggle = () => setReady(true)

  createEffect(() => {
    // We need the tracking elements bounds beforehand in order to inject it into the portal
    rect = props.track.getBoundingClientRect()
    // And now we can proceed
    toggle()
  }, [props.track])

  return (
    <>
      {ready() &&
        createPortal(
          <Container
            canvasSize={store.size}
            frames={props.frames}
            scene={store.scene}
            track={props.track}
            rect={rect}
            index={props.index}
          >
            {props.children}
            {/* Without an element that receives pointer events state.pointer will always be 0/0 */}
            <T.Group onPointerOver={() => null} />
          </Container>,
          virtualScene,
          { events: { compute, priority: props.index }, size: { width: rect.width, height: rect.height } }
        )}
    </>
  )
}
