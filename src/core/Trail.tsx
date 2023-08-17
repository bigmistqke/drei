import { Portal, T, useFrame, useThree } from '@solid-three/fiber'
import { MeshLineGeometry as MeshLineGeometryImpl, MeshLineMaterial } from 'meshline'
import {
  Accessor,
  children,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  mergeProps,
  on,
  type JSX,
} from 'solid-js'
import { ColorRepresentation, Group, Object3D, Vector2, Vector3 } from 'three'
import { defaultProps } from '../helpers/defaultProps'
import { resolveAccessor } from '../helpers/resolveAccessor'
import { RefComponent } from '../helpers/typeHelpers'
import { when } from '../helpers/when'

type Settings = {
  width: number
  length: number
  decay: number
  /**
   * Wether to use the target's world or local positions
   */
  local: boolean
  // Min distance between previous and current points
  stride: number
  // Number of frames to wait before next calculation
  interval: number
}

type TrailProps = {
  color?: ColorRepresentation
  attenuation?: (width: number) => number
  target?: Object3D
} & Partial<Settings>

const defaults = {
  width: 0.2,
  length: 1,
  decay: 1,
  local: false,
  stride: 0,
  interval: 1,
}

const shiftLeft = (collection: Float32Array, steps = 1): Float32Array => {
  collection.set(collection.subarray(steps))
  collection.fill(-Infinity, -steps)
  return collection
}

export function useTrail(target: Object3D | Accessor<Object3D>, settings: Partial<Settings>) {
  const completeSettings = mergeProps(defaults, settings)

  // let points: Float32Array
  const [points, setPoints] = createSignal<Float32Array>(null!, { equals: false })
  const worldPosition = new Vector3()

  createRenderEffect(() =>
    when(resolveAccessor(target))((target) =>
      setPoints(
        Float32Array.from({ length: completeSettings.length * 10 * 3 }, (_, i) => target.position.getComponent(i % 3))
      )
    )
  )

  const prevPosition = new Vector3()
  let frameCount = 0

  useFrame(() => {
    when(
      points,
      resolveAccessor(target)
    )((points, target) => {
      if (frameCount === 0) {
        let newPosition: Vector3
        if (completeSettings.local) {
          newPosition = target.position
        } else {
          target.getWorldPosition(worldPosition)
          newPosition = worldPosition
        }

        const steps = 1 * completeSettings.decay
        for (let i = 0; i < steps; i++) {
          if (newPosition.distanceTo(prevPosition) < completeSettings.stride) continue

          shiftLeft(points, 3)

          setPoints((points) => {
            points!.set(newPosition.toArray(), points!.length - 3)
            return points
          })
        }
        prevPosition.copy(newPosition)
      }
      frameCount++
      frameCount = frameCount % completeSettings.interval
    })
  })

  return points
}

export type MeshLineGeometry = THREE.Mesh & MeshLineGeometryImpl

export const Trail: RefComponent<MeshLineGeometry, TrailProps & { children?: JSX.Element }> = (_props) => {
  const props = defaultProps(_props, { ...defaults, color: 'hotpink' })

  const store = useThree()

  let ref: Group = null!
  const [anchor, setAnchor] = createSignal<Object3D>(null!)

  const points = useTrail(anchor, {
    length: props.length,
    decay: props.decay,
    local: props.local,
    stride: props.stride,
    interval: props.interval,
  })

  createEffect(
    on(
      () => props.target,
      () => {
        const t =
          props.target ||
          ref.children.find((o) => {
            return o instanceof Object3D
          })

        if (t) {
          setAnchor(t)
        }
      }
    )
  )

  const resolvedChildren = children(() => props.children)

  const geo = new MeshLineGeometryImpl()
  const mat = createMemo(() => {
    if (store.size.width === 0 || store.size.height === 0) return undefined
    const m = new MeshLineMaterial({
      lineWidth: 0.1 * props.width,
      color: props.color,
      sizeAttenuation: 1,
      resolution: new Vector2(store.size.width, store.size.height),
    })

    // Get and apply first <T.MeshLineMaterial /> from children
    let matOverride
    when(resolvedChildren)((children) => {
      if (children) {
        if (Array.isArray(children)) {
          matOverride = children.find((child: any) => {
            if (typeof child === 'function') {
              const c = child()
              return typeof c.type === 'string' && c.type === 'meshLineMaterial'
            }
          })
        } else {
          if (typeof children === 'function') {
            const c = (children as any)()
            if (typeof c.type === 'string' && c.type === 'meshLineMaterial') {
              matOverride = c
            }
          }
        }
      }
    })

    if (typeof matOverride?.props === 'object') {
      m.setValues(matOverride.props)
    }

    return m
  })

  createRenderEffect(() => {
    mat()?.uniforms.resolution.value.set(store.size.width, store.size.height)
  })

  useFrame(() => {
    when(points)((points) => {
      geo.setPoints(points, props.attenuation)
    })
  })

  return (
    <T.Group>
      <Portal container={store.scene}>
        <T.Mesh ref={props.ref} geometry={geo} material={mat()} />
      </Portal>

      <T.Group ref={ref}>{resolvedChildren()}</T.Group>
    </T.Group>
  )
}
