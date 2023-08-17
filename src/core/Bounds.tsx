import { T, ThreeProps, useFrame, useThree } from '@solid-three/fiber'
import { createContext, createRenderEffect, onCleanup, useContext } from 'solid-js'
import * as THREE from 'three'
import { defaultProps } from '../helpers/defaultProps'

export type SizeProps = {
  box: THREE.Box3
  size: THREE.Vector3
  center: THREE.Vector3
  distance: number
}

export type BoundsApi = {
  getSize: () => SizeProps
  refresh(object?: THREE.Object3D | THREE.Box3): any
  clip(): any
  fit(): any
  to: ({ position, target }: { position: [number, number, number]; target?: [number, number, number] }) => any
}

export type BoundsProps = ThreeProps<'Group'> & {
  damping?: number
  fit?: boolean
  clip?: boolean
  observe?: boolean
  margin?: number
  eps?: number
  onFit?: (data: SizeProps) => void
}

type ControlsProto = {
  update(): void
  target: THREE.Vector3
  maxDistance: number
  addEventListener: (event: string, callback: (event: any) => void) => void
  removeEventListener: (event: string, callback: (event: any) => void) => void
}

const isOrthographic = (def: THREE.Camera): def is THREE.OrthographicCamera =>
  def && (def as THREE.OrthographicCamera).isOrthographicCamera
const isBox3 = (def: any): def is THREE.Box3 => def && (def as THREE.Box3).isBox3

const context = createContext<BoundsApi>(null!)
export function Bounds(_props: BoundsProps) {
  const props = defaultProps(_props, {
    damping: 6,
    margin: 1.2,
    eps: 0.01,
  })

  let ref: THREE.Group
  const store = useThree()
  const controls = () => store.controls as unknown as ControlsProto

  let onFitRef = props.onFit

  function equals(a, b) {
    return Math.abs(a.x - b.x) < props.eps && Math.abs(a.y - b.y) < props.eps && Math.abs(a.z - b.z) < props.eps
  }

  function damp(v, t, lambda, delta) {
    v.x = THREE.MathUtils.damp(v.x, t.x, lambda, delta)
    v.y = THREE.MathUtils.damp(v.y, t.y, lambda, delta)
    v.z = THREE.MathUtils.damp(v.z, t.z, lambda, delta)
  }

  const current = {
    animating: false,
    focus: new THREE.Vector3(),
    camera: new THREE.Vector3(),
    zoom: 1,
  }
  const goal = { focus: new THREE.Vector3(), camera: new THREE.Vector3(), zoom: 1 }

  const box = new THREE.Box3()
  const api: BoundsApi = (() => {
    function getSize() {
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // s3f    store.camera.aspect got initialized with store.camera.aspect 0
      //        causing `fitWidthDistance` to be Infinity
      //        investigate further why store.camera.aspect is 0 in the beginning
      if ('aspect' in store.camera && store.camera.aspect === 0) {
        return { box, size, center, distance: 0 }
      }

      const maxSize = Math.max(size.x, size.y, size.z)
      const fitHeightDistance = isOrthographic(store.camera)
        ? maxSize * 4
        : maxSize / (2 * Math.atan((Math.PI * store.camera.fov) / 360))
      const fitWidthDistance = isOrthographic(store.camera) ? maxSize * 4 : fitHeightDistance / store.camera.aspect
      const distance = props.margin * Math.max(fitHeightDistance, fitWidthDistance)
      return { box, size, center, distance }
    }

    return {
      getSize,
      refresh(object?: THREE.Object3D | THREE.Box3) {
        if (isBox3(object)) box.copy(object)
        else {
          const target = object || ref
          if (target) {
            target.updateWorldMatrix(true, true)
            box.setFromObject(target)
          }
        }
        if (box.isEmpty()) {
          const max = store.camera.position.length() || 10
          box.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(max, max, max))
        }

        if (controls()?.constructor.name === 'OrthographicTrackballControls') {
          // Put camera on a sphere along which it should move
          const { distance } = getSize()
          const direction = store.camera.position.clone().sub(controls().target).normalize().multiplyScalar(distance)
          const newPos = controls().target.clone().add(direction)
          store.camera.position.copy(newPos)
        }

        return this
      },
      clip() {
        const { distance } = getSize()
        if (controls()) controls().maxDistance = distance * 10
        store.camera.near = distance / 100
        store.camera.far = distance * 100
        store.camera.updateProjectionMatrix()
        if (controls()) controls().update()
        store.invalidate()
        return this
      },
      to({ position, target }: { position: [number, number, number]; target?: [number, number, number] }) {
        current.camera.copy(store.camera.position)
        const { center } = getSize()
        goal.camera.set(...position)

        if (target) {
          goal.focus.set(...target)
        } else {
          goal.focus.copy(center)
        }

        if (props.damping) {
          current.animating = true
        } else {
          store.camera.position.set(...position)
        }

        return this
      },
      fit() {
        current.camera.copy(store.camera.position)
        if (controls()) current.focus.copy(controls().target)

        const { center, distance } = getSize()
        const direction = center.clone().sub(store.camera.position).normalize().multiplyScalar(distance)

        goal.camera.copy(center).sub(direction)
        goal.focus.copy(center)

        if (isOrthographic(store.camera)) {
          current.zoom = store.camera.zoom

          let maxHeight = 0,
            maxWidth = 0
          const vertices = [
            new THREE.Vector3(box.min.x, box.min.y, box.min.z),
            new THREE.Vector3(box.min.x, box.max.y, box.min.z),
            new THREE.Vector3(box.min.x, box.min.y, box.max.z),
            new THREE.Vector3(box.min.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.min.z),
            new THREE.Vector3(box.max.x, box.min.y, box.max.z),
            new THREE.Vector3(box.max.x, box.min.y, box.min.z),
          ]
          // Transform the center and each corner to camera space
          center.applyMatrix4(store.camera.matrixWorldInverse)
          for (const v of vertices) {
            v.applyMatrix4(store.camera.matrixWorldInverse)
            maxHeight = Math.max(maxHeight, Math.abs(v.y - center.y))
            maxWidth = Math.max(maxWidth, Math.abs(v.x - center.x))
          }
          maxHeight *= 2
          maxWidth *= 2
          const zoomForHeight = (store.camera.top - store.camera.bottom) / maxHeight
          const zoomForWidth = (store.camera.right - store.camera.left) / maxWidth
          goal.zoom = Math.min(zoomForHeight, zoomForWidth) / props.margin
          if (!props.damping) {
            store.camera.zoom = goal.zoom
            store.camera.updateProjectionMatrix()
          }
        }

        if (props.damping) {
          current.animating = true
        } else {
          store.camera.position.copy(goal.camera)
          store.camera.lookAt(goal.focus)
          if (controls()) {
            controls().target.copy(goal.focus)
            controls().update()
          }
        }
        if (onFitRef) onFitRef(this.getSize())
        store.invalidate()
        return this
      },
    }
  })()

  createRenderEffect(() => {
    if (controls()) {
      // Try to prevent drag hijacking
      const callback = () => (current.animating = false)
      controls().addEventListener('start', callback)
      onCleanup(() => controls().removeEventListener('start', callback))
    }
  })

  // Scale pointer on window resize
  let count = 0
  createRenderEffect(() => {
    if (props.observe || count++ === 0) {
      api.refresh()
      if (props.fit) api.fit()
      if (props.clip) api.clip()
    }
  })

  useFrame((state, delta) => {
    if (current.animating) {
      damp(current.focus, goal.focus, props.damping, delta)
      damp(current.camera, goal.camera, props.damping, delta)
      current.zoom = THREE.MathUtils.damp(current.zoom, goal.zoom, props.damping, delta)
      store.camera.position.copy(current.camera)

      if (isOrthographic(store.camera)) {
        store.camera.zoom = current.zoom
        store.camera.updateProjectionMatrix()
      }

      if (!controls()) {
        store.camera.lookAt(current.focus)
      } else {
        controls().target.copy(current.focus)
        controls().update()
      }

      store.invalidate()
      if (isOrthographic(store.camera) && !(Math.abs(current.zoom - goal.zoom) < props.eps)) return
      if (!isOrthographic(store.camera) && !equals(current.camera, goal.camera)) return
      if (controls() && !equals(current.focus, goal.focus)) return
      current.animating = false
    }
  })

  return (
    <T.Group ref={ref!}>
      <context.Provider value={api}>{props.children}</context.Provider>
    </T.Group>
  )
}

export function useBounds() {
  return useContext(context)
}
