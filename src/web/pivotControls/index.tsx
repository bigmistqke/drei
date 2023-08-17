import { Size, T, useFrame, useThree } from '@solid-three/fiber'
import { createMemo, createRenderEffect, type JSX } from 'solid-js'
import * as THREE from 'three'

import { processProps } from '../../helpers/processProps'
import { RefComponent } from '../../helpers/typeHelpers'
import { createImperativeHandle } from '../../helpers/useImperativeHandle'
import { AxisArrow } from './AxisArrow'
import { AxisRotator } from './AxisRotator'
import { PlaneSlider } from './PlaneSlider'
import { OnDragStartProps, context } from './context'

const tV0 = new THREE.Vector3()
const tV1 = new THREE.Vector3()
const tV2 = new THREE.Vector3()

const getPoint2 = (point3: THREE.Vector3, camera: THREE.Camera, size: Size) => {
  const widthHalf = size.width / 2
  const heightHalf = size.height / 2
  camera.updateMatrixWorld(false)
  const vector = point3.project(camera)
  vector.x = vector.x * widthHalf + widthHalf
  vector.y = -(vector.y * heightHalf) + heightHalf
  return vector
}

const getPoint3 = (point2: THREE.Vector3, camera: THREE.Camera, size: Size, zValue: number = 1) => {
  const vector = tV0.set((point2.x / size.width) * 2 - 1, -(point2.y / size.height) * 2 + 1, zValue)
  vector.unproject(camera)
  return vector
}

export const calculateScaleFactor = (point3: THREE.Vector3, radiusPx: number, camera: THREE.Camera, size: Size) => {
  const point2 = getPoint2(tV2.copy(point3), camera, size)
  let scale = 0
  for (let i = 0; i < 2; ++i) {
    const point2off = tV1.copy(point2).setComponent(i, point2.getComponent(i) + radiusPx)
    const point3off = getPoint3(point2off, camera, size, point2off.z)
    scale = Math.max(scale, point3.distanceTo(point3off))
  }
  return scale
}

const mL0 = new THREE.Matrix4()
const mW0 = new THREE.Matrix4()
const mP = new THREE.Matrix4()
const mPInv = new THREE.Matrix4()
const mW = new THREE.Matrix4()
const mL = new THREE.Matrix4()
const mL0Inv = new THREE.Matrix4()
const mdL = new THREE.Matrix4()

const bb = new THREE.Box3()
const bbObj = new THREE.Box3()
const vCenter = new THREE.Vector3()
const vSize = new THREE.Vector3()
const vAnchorOffset = new THREE.Vector3()
const vPosition = new THREE.Vector3()

const xDir = new THREE.Vector3(1, 0, 0)
const yDir = new THREE.Vector3(0, 1, 0)
const zDir = new THREE.Vector3(0, 0, 1)

type PivotControlsProps = {
  /** Scale of the gizmo, 1 */
  scale?: number
  /** Width of the gizmo lines, this is a THREE.Line2 prop, 2.5 */
  lineWidth?: number
  /** If fixed is true is remains constant in size, scale is now in pixels, false */
  fixed?: boolean
  /** Pivot does not act as a group, it won't shift contents but can offset in position */
  offset?: [number, number, number]
  /** Starting rotation */
  rotation?: [number, number, number]

  /** Starting matrix */
  matrix?: THREE.Matrix4
  /** BBAnchor, each axis can be between -1/0/+1 */
  anchor?: [number, number, number]
  /** If autoTransform is true, automatically apply the local transform on drag, true */
  autoTransform?: boolean
  /** Allows you to switch individual axes off */
  activeAxes?: [boolean, boolean, boolean]

  disableAxes?: boolean
  disableSliders?: boolean
  disableRotations?: boolean

  /** Limits */
  translationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]
  rotationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]

  /** RGB colors */
  axisColors?: [string | number, string | number, string | number]
  /** Color of the hovered item */
  hoveredColor?: string | number
  /** HTML value annotations, default: false */
  annotations?: boolean
  /** CSS Classname applied to the HTML annotations */
  annotationsClass?: string
  /** Drag start event */
  onDragStart?: (props: OnDragStartProps) => void
  /** Drag event */
  onDrag?: (l: THREE.Matrix4, deltaL: THREE.Matrix4, w: THREE.Matrix4, deltaW: THREE.Matrix4) => void
  /** Drag end event */
  onDragEnd?: () => void
  /** Set this to false if you want the gizmo to be visible through faces */
  depthTest?: boolean
  opacity?: number
  visible?: boolean
  userData?: { [key: string]: any }
  children?: JSX.Element
}

export const PivotControls: RefComponent<THREE.Group, PivotControlsProps> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      autoTransform: true,
      disableAxes: false,
      disableSliders: false,
      disableRotations: false,
      activeAxes: [true, true, true],
      offset: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      lineWidth: 4,
      fixed: false,
      depthTest: true,
      axisColors: ['#ff2060', '#20df80', '#2080ff'],
      hoveredColor: '#ffff40',
      annotations: false,
      opacity: 1,
      visible: true,
    },
    [
      'ref',
      'matrix',
      'onDragStart',
      'onDrag',
      'onDragEnd',
      'autoTransform',
      'anchor',
      'disableAxes',
      'disableSliders',
      'disableRotations',
      'activeAxes',
      'offset',
      'rotation',
      'scale',
      'lineWidth',
      'fixed',
      'translationLimits',
      'rotationLimits',
      'depthTest',
      'axisColors',
      'hoveredColor',
      'annotations',
      'annotationsClass',
      'opacity',
      'visible',
      'userData',
      'children',
    ]
  )

  const store = useThree()
  let parentRef: THREE.Group = null!
  let ref: THREE.Group = null!
  let gizmoRef: THREE.Group = null!
  let childrenRef: THREE.Group = null!
  let translation: [number, number, number] = [0, 0, 0]

  createRenderEffect(() => {
    if (!props.anchor) return
    childrenRef.updateWorldMatrix(true, true)

    mPInv.copy(childrenRef.matrixWorld).invert()
    bb.makeEmpty()
    childrenRef.traverse((obj: any) => {
      if (!obj.geometry) return
      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox()
      mL.copy(obj.matrixWorld).premultiply(mPInv)
      bbObj.copy(obj.geometry.boundingBox)
      bbObj.applyMatrix4(mL)
      bb.union(bbObj)
    })
    vCenter.copy(bb.max).add(bb.min).multiplyScalar(0.5)
    vSize.copy(bb.max).sub(bb.min).multiplyScalar(0.5)
    vAnchorOffset
      .copy(vSize)
      .multiply(new THREE.Vector3(...props.anchor))
      .add(vCenter)
    vPosition.set(...props.offset).add(vAnchorOffset)
    gizmoRef.position.copy(vPosition)
    store.invalidate()
  })

  // s3f: we could prevent a createMemo with some getters
  const config = createMemo(() => ({
    onDragStart: (_props: OnDragStartProps) => {
      mL0.copy(ref.matrix)
      mW0.copy(ref.matrixWorld)
      props.onDragStart && props.onDragStart(_props)
      store.invalidate()
    },
    onDrag: (mdW: THREE.Matrix4) => {
      mP.copy(parentRef.matrixWorld)
      mPInv.copy(mP).invert()
      // After applying the delta
      mW.copy(mW0).premultiply(mdW)
      mL.copy(mW).premultiply(mPInv)
      mL0Inv.copy(mL0).invert()
      mdL.copy(mL).multiply(mL0Inv)
      if (props.autoTransform) ref.matrix.copy(mL)
      props.onDrag && props.onDrag(mL, mdL, mW, mdW)
      store.invalidate()
    },
    onDragEnd: () => {
      if (props.onDragEnd) props.onDragEnd()
      store.invalidate()
    },
    translation,
    translationLimits: props.translationLimits,
    rotationLimits: props.rotationLimits,
    axisColors: props.axisColors,
    hoveredColor: props.hoveredColor,
    opacity: props.opacity,
    scale: props.scale,
    lineWidth: props.lineWidth,
    fixed: props.fixed,
    depthTest: props.depthTest,
    userData: props.userData,
    annotations: props.annotations,
    annotationsClass: props.annotationsClass,
  }))

  const vec = new THREE.Vector3()
  useFrame((state) => {
    if (props.fixed) {
      const sf = calculateScaleFactor(gizmoRef.getWorldPosition(vec), props.scale, state.camera, state.size)
      if (gizmoRef) {
        if (gizmoRef?.scale.x !== sf || gizmoRef?.scale.y !== sf || gizmoRef?.scale.z !== sf) {
          gizmoRef.scale.setScalar(sf)
          state.invalidate()
        }
      }
    }
  })
  createImperativeHandle(props, () => ref)

  createRenderEffect(() => {
    // If the matrix is a real matrix4 it means that the user wants to control the gizmo
    // In that case it should just be set, as a bare prop update would merely copy it
    if (props.matrix && props.matrix instanceof THREE.Matrix4) ref.matrix = props.matrix
  })

  return (
    <context.Provider value={config()}>
      <T.Group ref={parentRef}>
        <T.Group ref={ref} matrix={props.matrix} matrixAutoUpdate={false} {...rest}>
          <T.Group visible={props.visible} ref={gizmoRef} position={props.offset} rotation={props.rotation}>
            {!props.disableAxes && props.activeAxes[0] && <AxisArrow axis={0} direction={xDir} />}
            {!props.disableAxes && props.activeAxes[1] && <AxisArrow axis={1} direction={yDir} />}
            {!props.disableAxes && props.activeAxes[2] && <AxisArrow axis={2} direction={zDir} />}
            {!props.disableSliders && props.activeAxes[0] && props.activeAxes[1] && (
              <PlaneSlider axis={2} dir1={xDir} dir2={yDir} />
            )}
            {!props.disableSliders && props.activeAxes[0] && props.activeAxes[2] && (
              <PlaneSlider axis={1} dir1={zDir} dir2={xDir} />
            )}
            {!props.disableSliders && props.activeAxes[2] && props.activeAxes[1] && (
              <PlaneSlider axis={0} dir1={yDir} dir2={zDir} />
            )}
            {!props.disableRotations && props.activeAxes[0] && props.activeAxes[1] && (
              <AxisRotator axis={2} dir1={xDir} dir2={yDir} />
            )}
            {!props.disableRotations && props.activeAxes[0] && props.activeAxes[2] && (
              <AxisRotator axis={1} dir1={zDir} dir2={xDir} />
            )}
            {!props.disableRotations && props.activeAxes[2] && props.activeAxes[1] && (
              <AxisRotator axis={0} dir1={yDir} dir2={zDir} />
            )}
          </T.Group>
          <T.Group ref={childrenRef}>{props.children}</T.Group>
        </T.Group>
      </T.Group>
    </context.Provider>
  )
}
