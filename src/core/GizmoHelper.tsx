import { T, useFrame, useThree } from '@solid-three/fiber'
import { createContext, createEffect, mergeProps, onCleanup, useContext } from 'solid-js'
import { Group, Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import { OrbitControls as OrbitControlsType } from 'three-stdlib'
import { Hud } from './Hud'
import { OrthographicCamera } from './OrthographicCamera'

type GizmoHelperContext = {
  tweenCamera: (direction: Vector3) => void
}

const Context = createContext<GizmoHelperContext>({} as GizmoHelperContext)

export const useGizmoContext = () => {
  return useContext<GizmoHelperContext>(Context)
}

const turnRate = 2 * Math.PI // turn rate in angles per second
const dummy = new Object3D()
const matrix = new Matrix4()
const [q1, q2] = [new Quaternion(), new Quaternion()]
const target = new Vector3()
const targetPosition = new Vector3()

type ControlsProto = { update(): void; target: THREE.Vector3 }

export type GizmoHelperProps = Parameters<typeof T.Group>[0] & {
  alignment?:
    | 'top-left'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'center-right'
    | 'center-left'
    | 'center-center'
    | 'top-center'
  margin?: [number, number]
  renderPriority?: number
  autoClear?: boolean
  onUpdate?: () => void // update controls during animation
  // TODO: in a new major state.controls should be the only means of consuming controls, the
  // onTarget prop can then be removed!
  onTarget?: () => Vector3 // return the target to rotate around
}

const isOrbitControls = (controls: ControlsProto): controls is OrbitControlsType => {
  return controls && 'minPolarAngle' in (controls as OrbitControlsType)
}

export const GizmoHelper = (_props: GizmoHelperProps): any => {
  const props = mergeProps({ alignment: 'bottom-right', margin: [80, 80], renderPriority: 1 }, _props)
  const store = useThree()

  let gizmoRef: Group
  let virtualCam: THREE.OrthographicCamera = null!

  let animating = false
  let radius = 0
  let focusPoint = new Vector3(0, 0, 0)
  let defaultUp = new Vector3(0, 0, 0)

  createEffect(() => {
    defaultUp.copy(store.camera.up)
  })

  const tweenCamera = (direction: Vector3) => {
    animating = true
    if (store.controls || props.onTarget) focusPoint = store.controls?.target || props.onTarget?.()
    radius = store.camera.position.distanceTo(target)

    // Rotate from current camera orientation
    q1.copy(store.camera.quaternion)

    // To new current camera orientation
    targetPosition.copy(direction).multiplyScalar(radius).add(target)

    dummy.lookAt(targetPosition)
    dummy.up.copy(store.camera.up)

    q2.copy(dummy.quaternion)

    store.invalidate()
  }

  useFrame((_, delta) => {
    if (virtualCam && gizmoRef) {
      // Animate step
      if (animating) {
        if (q1.angleTo(q2) < 0.01) {
          animating = false
          // Orbit controls uses UP vector as the orbit axes,
          // so we need to reset it after the animation is done
          // moving it around for the controls to work correctly
          if (isOrbitControls(store.controls as any as ControlsProto)) {
            store.camera.up.copy(defaultUp)
          }
        } else {
          const step = delta * turnRate
          // animate position by doing a slerp and then scaling the position on the unit sphere
          q1.rotateTowards(q2, step)
          // animate orientation
          store.camera.position.set(0, 0, 1).applyQuaternion(q1).multiplyScalar(radius).add(focusPoint)
          store.camera.up.set(0, 1, 0).applyQuaternion(q1).normalize()
          store.camera.quaternion.copy(q1)
          if (props.onUpdate) props.onUpdate()
          else if (store.controls) (store.controls as any as ControlsProto).update()
          store.invalidate()
        }
      }

      // Sync Gizmo with main camera orientation
      matrix.copy(store.camera.matrix).invert()
      gizmoRef?.quaternion.setFromRotationMatrix(matrix)
    }
  })

  // Position gizmo component within scene
  const position = () => {
    const [marginX, marginY] = props.margin
    const x = props.alignment.endsWith('-center')
      ? 0
      : props.alignment.endsWith('-left')
      ? -store.size.width / 2 + marginX
      : store.size.width / 2 - marginX
    const y = props.alignment.startsWith('center-')
      ? 0
      : props.alignment.startsWith('top-')
      ? store.size.height / 2 - marginY
      : -store.size.height / 2 + marginY

    return [x, y, 0] as [number, number, number]
  }

  onCleanup(() => console.log('cleanup gizmo'))

  return (
    <Hud renderPriority={props.renderPriority}>
      <Context.Provider
        value={{
          tweenCamera,
        }}
      >
        <OrthographicCamera makeDefault ref={virtualCam!} position={[0, 0, 200]} />
        <T.Group ref={gizmoRef!} position={position()}>
          {props.children}
        </T.Group>
      </Context.Provider>
    </Hud>
  )
}
