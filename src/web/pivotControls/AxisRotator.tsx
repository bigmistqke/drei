import { T, ThreeEvent, useThree } from '@solid-three/fiber'
import clamp from 'lodash.clamp'
import { Component, createMemo, createSignal, useContext } from 'solid-js'
import * as THREE from 'three'
import { Line } from '../../core/Line'
import { Html } from '../Html'
import { context } from './context'

const clickDir = new THREE.Vector3()
const intersectionDir = new THREE.Vector3()

const toDegrees = (radians: number) => (radians * 180) / Math.PI
const toRadians = (degrees: number) => (degrees * Math.PI) / 180

const calculateAngle = (
  clickPoint: THREE.Vector3,
  intersectionPoint: THREE.Vector3,
  origin: THREE.Vector3,
  e1: THREE.Vector3,
  e2: THREE.Vector3
) => {
  clickDir.copy(clickPoint).sub(origin)
  intersectionDir.copy(intersectionPoint).sub(origin)
  const dote1e1 = e1.dot(e1)
  const dote2e2 = e2.dot(e2)
  const uClick = clickDir.dot(e1) / dote1e1
  const vClick = clickDir.dot(e2) / dote2e2
  const uIntersection = intersectionDir.dot(e1) / dote1e1
  const vIntersection = intersectionDir.dot(e2) / dote2e2
  const angleClick = Math.atan2(vClick, uClick)
  const angleIntersection = Math.atan2(vIntersection, uIntersection)
  return angleIntersection - angleClick
}

const fmod = (num: number, denom: number) => {
  let k = Math.floor(num / denom)
  k = k < 0 ? k + 1 : k

  return num - k * denom
}

const minimizeAngle = (angle: number) => {
  let result = fmod(angle, 2 * Math.PI)

  if (Math.abs(result) < 1e-6) {
    return 0.0
  }

  if (result < 0.0) {
    result += 2 * Math.PI
  }

  return result
}

const rotMatrix = new THREE.Matrix4()
const posNew = new THREE.Vector3()
const ray = new THREE.Ray()
const intersection = new THREE.Vector3()

export const AxisRotator: Component<{ dir1: THREE.Vector3; dir2: THREE.Vector3; axis: 0 | 1 | 2 }> = (props) => {
  const {
    rotationLimits,
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
  } = useContext(context)!

  // @ts-expect-error new in @solid-three/fiber@7.0.5
  const camControls = useThree((state) => state.controls) as { enabled: boolean }
  let divRef: HTMLDivElement = null!
  let objRef: THREE.Group = null!
  let angle0: number = 0
  let angle: number = 0
  let clickInfo: {
    clickPoint: THREE.Vector3
    origin: THREE.Vector3
    e1: THREE.Vector3
    e2: THREE.Vector3
    normal: THREE.Vector3
    plane: THREE.Plane
  } | null = null
  const [isHovered, setIsHovered] = createSignal(false)

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (annotations) {
      divRef.innerText = `${toDegrees(angle).toFixed(0)}º`
      divRef.style.display = 'block'
    }
    e.stopPropagation()
    const clickPoint = e.point.clone()
    const origin = new THREE.Vector3().setFromMatrixPosition(objRef.matrixWorld)
    const e1 = new THREE.Vector3().setFromMatrixColumn(objRef.matrixWorld, 0).normalize()
    const e2 = new THREE.Vector3().setFromMatrixColumn(objRef.matrixWorld, 1).normalize()
    const normal = new THREE.Vector3().setFromMatrixColumn(objRef.matrixWorld, 2).normalize()
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin)
    clickInfo = { clickPoint, origin, e1, e2, normal, plane }
    onDragStart({ component: 'Rotator', axis: props.axis, origin, directions: [e1, e2, normal] })
    camControls && (camControls.enabled = false)
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!isHovered) setIsHovered(true)
    if (clickInfo) {
      const { clickPoint, origin, e1, e2, normal, plane } = clickInfo
      const [min, max] = rotationLimits?.[props.axis] || [undefined, undefined]

      ray.copy(e.ray)
      ray.intersectPlane(plane, intersection)
      ray.direction.negate()
      ray.intersectPlane(plane, intersection)
      let deltaAngle = calculateAngle(clickPoint, intersection, origin, e1, e2)
      let degrees = toDegrees(deltaAngle)

      // @ts-ignore
      if (e.shiftKey) {
        degrees = Math.round(degrees / 10) * 10
        deltaAngle = toRadians(degrees)
      }

      if (min !== undefined && max !== undefined && max - min < 2 * Math.PI) {
        deltaAngle = minimizeAngle(deltaAngle)
        deltaAngle = deltaAngle > Math.PI ? deltaAngle - 2 * Math.PI : deltaAngle
        deltaAngle = clamp(deltaAngle, min - angle0, max - angle0)
        angle = angle0 + deltaAngle
      } else {
        angle = minimizeAngle(angle0 + deltaAngle)
        angle = angle > Math.PI ? angle - 2 * Math.PI : angle
      }

      if (annotations) {
        degrees = toDegrees(angle)
        divRef.innerText = `${degrees.toFixed(0)}º`
      }
      rotMatrix.makeRotationAxis(normal, deltaAngle)
      posNew.copy(origin).applyMatrix4(rotMatrix).sub(origin).negate()
      rotMatrix.setPosition(posNew)
      onDrag(rotMatrix)
    }
  }

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (annotations) {
      divRef.style.display = 'none'
    }
    e.stopPropagation()
    angle0 = angle
    clickInfo = null
    onDragEnd()
    camControls && (camControls.enabled = true)
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId)
  }

  const onPointerOut = (e: any) => {
    e.stopPropagation()
    setIsHovered(false)
  }

  const matrixL = createMemo(() => {
    const dir1N = props.dir1.clone().normalize()
    const dir2N = props.dir2.clone().normalize()
    return new THREE.Matrix4().makeBasis(dir1N, dir2N, dir1N.clone().cross(dir2N))
  }, [props.dir1, props.dir2])

  const r = fixed ? 0.65 : scale * 0.65

  const arc = createMemo(() => {
    const segments = 32
    const points: THREE.Vector3[] = []
    for (let j = 0; j <= segments; j++) {
      const angle = (j * (Math.PI / 2)) / segments
      points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0))
    }
    return points
  }, [r])

  return (
    <T.Group
      ref={objRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerOut}
      matrix={matrixL()}
      matrixAutoUpdate={false}
    >
      {annotations && (
        <Html position={[r, r, 0]}>
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
      <Line points={arc()} lineWidth={lineWidth * 4} visible={false} userData={userData} />
      {/* The visible mesh */}
      <Line
        transparent
        raycast={() => null}
        depthTest={depthTest}
        points={arc()}
        lineWidth={lineWidth}
        color={(isHovered() ? hoveredColor : axisColors[props.axis]) as any}
        opacity={opacity}
        polygonOffset
        polygonOffsetFactor={-10}
        fog={false}
      />
    </T.Group>
  )
}
