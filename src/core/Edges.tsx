import { SolidThreeFiber, T } from '@solid-three/fiber'
import { createRenderEffect } from 'solid-js'
import * as THREE from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'

type Props = Parameters<typeof T.LineSegments>[0] & {
  threshold?: number
  color?: SolidThreeFiber.Color
}

export const Edges: RefComponent<THREE.LineSegments, Props, true> = (_props) => {
  const [props, rest] = processProps(_props, { threshold: 15, color: 'black' }, [
    'ref',
    'userData',
    'children',
    'geometry',
    'threshold',
    'color',
  ])
  const ref: THREE.LineSegments = null!
  createRenderEffect(() => {
    const parent = ref.parent as THREE.Mesh
    if (parent) {
      const geom = props.geometry || parent.geometry
      if (geom !== ref.userData.currentGeom || props.threshold !== ref.userData.currentThreshold) {
        ref.userData.currentGeom = geom
        ref.userData.currentThreshold = props.threshold
        ref.geometry = new THREE.EdgesGeometry(geom, props.threshold)
      }
    }
  })
  createImperativeHandle(props, () => ref)
  return (
    <T.LineSegments ref={ref} raycast={() => null} {...rest}>
      {props.children ? props.children : <T.LineBasicMaterial color={props.color} />}
    </T.LineSegments>
  )
}
