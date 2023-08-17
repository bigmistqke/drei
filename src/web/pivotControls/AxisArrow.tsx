import { T, ThreeEvent, useThree } from '@solid-three/fiber'
import { Component, createMemo, createSignal, useContext } from 'solid-js'
import * as THREE from 'three'
import { Line } from '../../core/Line'
import { Html } from '../Html'
import { context as pivotContext } from './context'

const vec1 = new THREE.Vector3()
const vec2 = new THREE.Vector3()

export const calculateOffset = (
  clickPoint: THREE.Vector3,
  normal: THREE.Vector3,
  rayStart: THREE.Vector3,
  rayDir: THREE.Vector3
) => {
  const e1 = normal.dot(normal)
  const e2 = normal.dot(clickPoint) - normal.dot(rayStart)
  const e3 = normal.dot(rayDir)

  if (e3 === 0) {
    return -e2 / e1
  }

  vec1
    .copy(rayDir)
    .multiplyScalar(e1 / e3)
    .sub(normal)
  vec2
    .copy(rayDir)
    .multiplyScalar(e2 / e3)
    .add(rayStart)
    .sub(clickPoint)

  const offset = -vec1.dot(vec2) / vec1.dot(vec1)
  return offset
}

const upV = new THREE.Vector3(0, 1, 0)
const offsetMatrix = new THREE.Matrix4()

export const AxisArrow: Component<{ direction: THREE.Vector3; axis: 0 | 1 | 2 }> = (props) => {
  const {
    translation,
    translationLimits,
    annotations,
    annotationsClass,
    depthTest,
    scale,
    lineWidth,
    fixed,
    axisColors,
    hoveredColor,
    opacity,
    onDragStart,
    onDrag,
    onDragEnd,
    userData,
  } = useContext(pivotContext)!

  const store = useThree()
  const controls = () => store.controls as unknown as { enabled: boolean }

  let divRef: HTMLDivElement = null!
  let objRef: THREE.Group = null!
  let clickInfo: { clickPoint: THREE.Vector3; dir: THREE.Vector3 } | null = null
  let offset0: number = 0
  const [isHovered, setIsHovered] = createSignal(false)

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (annotations) {
      divRef.innerText = `${translation[props.axis].toFixed(2)}`
      divRef.style.display = 'block'
    }
    e.stopPropagation()
    const rotation = new THREE.Matrix4().extractRotation(objRef.matrixWorld)
    const clickPoint = e.point.clone()
    const origin = new THREE.Vector3().setFromMatrixPosition(objRef.matrixWorld)
    const dir = props.direction.clone().applyMatrix4(rotation).normalize()
    clickInfo = { clickPoint, dir }
    offset0 = translation[props.axis]
    onDragStart({ component: 'Arrow', axis: props.axis, origin, directions: [dir] })
    controls() && (controls().enabled = false)
    // @ts-ignore - setPointerCapture is not in the type definition
    e.target.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!isHovered) setIsHovered(true)

    if (clickInfo) {
      const { clickPoint, dir } = clickInfo
      const [min, max] = translationLimits?.[props.axis] || [undefined, undefined]

      let offset = calculateOffset(clickPoint, dir, e.ray.origin, e.ray.direction)
      if (min !== undefined) {
        offset = Math.max(offset, min - offset0)
      }
      if (max !== undefined) {
        offset = Math.min(offset, max - offset0)
      }
      translation[props.axis] = offset0 + offset
      if (annotations) {
        divRef.innerText = `${translation[props.axis].toFixed(2)}`
      }
      offsetMatrix.makeTranslation(dir.x * offset, dir.y * offset, dir.z * offset)
      onDrag(offsetMatrix)
    }
  }

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (annotations) {
      divRef.style.display = 'none'
    }
    e.stopPropagation()
    clickInfo = null
    onDragEnd()
    controls() && (controls().enabled = true)
    // @ts-ignore - releasePointerCapture & PointerEvent#pointerId is not in the type definition
    e.target.releasePointerCapture(e.pointerId)
  }

  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(false)
  }

  const memo = createMemo(() => {
    const coneWidth = fixed ? (lineWidth / scale) * 1.6 : scale / 20
    const coneLength = fixed ? 0.2 : scale / 5
    const cylinderLength = fixed ? 1 - coneLength : scale - coneLength
    const quaternion = new THREE.Quaternion().setFromUnitVectors(upV, props.direction.clone().normalize())
    const matrixL = new THREE.Matrix4().makeRotationFromQuaternion(quaternion)
    return { cylinderLength, coneWidth, coneLength, matrixL }
  })

  const color_ = isHovered() ? hoveredColor : axisColors[props.axis]

  return (
    <T.Group ref={objRef}>
      <T.Group
        matrix={memo().matrixL}
        matrixAutoUpdate={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerOut}
      >
        {annotations && (
          <Html position={[0, -memo().coneLength, 0]}>
            <div
              style={{
                display: 'none',
                background: '#151520',
                color: 'white',
                padding: '6px 8px',
                'border-radius': '7px',
                'white-space': 'nowrap',
              }}
              class={annotationsClass}
              ref={divRef}
            />
          </Html>
        )}
        {/* The invisible mesh being raycast */}
        <T.Mesh
          visible={false}
          position={[0, (memo().cylinderLength + memo().coneLength) / 2.0, 0]}
          userData={userData}
        >
          <T.CylinderGeometry
            args={[memo().coneWidth * 1.4, memo().coneWidth * 1.4, memo().cylinderLength + memo().coneLength, 8, 1]}
          />
        </T.Mesh>
        {/* The visible mesh */}
        <Line
          transparent
          raycast={() => null}
          depthTest={depthTest}
          points={[0, 0, 0, 0, memo().cylinderLength, 0] as any}
          lineWidth={lineWidth}
          color={color_ as any}
          opacity={opacity}
          polygonOffset
          renderOrder={1}
          polygonOffsetFactor={-10}
          fog={false}
        />
        <T.Mesh
          raycast={() => null}
          position={[0, memo().cylinderLength + memo().coneLength / 2.0, 0]}
          renderOrder={500}
        >
          <T.ConeGeometry args={[memo().coneWidth, memo().coneLength, 24, 1]} />
          <T.MeshBasicMaterial
            transparent
            depthTest={depthTest}
            color={color_}
            opacity={opacity}
            polygonOffset
            polygonOffsetFactor={-10}
            fog={false}
          />
        </T.Mesh>
      </T.Group>
    </T.Group>
  )
}
