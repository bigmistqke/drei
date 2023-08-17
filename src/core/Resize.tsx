import { T, ThreeProps } from '@solid-three/fiber'
import { createEffect } from 'solid-js'
import * as THREE from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'

export type ResizeProps = ThreeProps<'Group'> & {
  /** Whether to fit into width (x axis), undefined */
  width?: boolean
  /** Whether to fit into height (y axis), undefined */
  height?: boolean
  /** Whether to fit into depth (z axis), undefined */
  depth?: boolean
  /** You can optionally pass the Box3, otherwise will be computed, undefined */
  box3?: THREE.Box3
  /** See https://threejs.org/docs/index.html?q=box3#api/en/math/Box3.setFromObject */
  precise?: boolean
}

export const Resize: RefComponent<THREE.Group, ResizeProps> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      precise: true,
    },
    ['ref', 'children', 'width', 'height', 'depth', 'box3', 'precise']
  )

  let ref: THREE.Group = null!
  let outer: THREE.Group = null!
  let inner: THREE.Group = null!

  createEffect(() => {
    outer.matrixWorld.identity()
    let box = props.box3 || new THREE.Box3().setFromObject(inner, props.precise)
    const w = box.max.x - box.min.x
    const h = box.max.y - box.min.y
    const d = box.max.z - box.min.z

    let dimension = Math.max(w, h, d)
    if (props.width) dimension = w
    if (props.height) dimension = h
    if (props.depth) dimension = d

    outer.scale.setScalar(1 / dimension)
  }, [props.width, props.height, props.depth, props.box3, props.precise])

  createImperativeHandle(props, () => ref)

  return (
    <T.Group {...rest} ref={ref}>
      <T.Group ref={outer}>
        <T.Group ref={inner}>{props.children}</T.Group>
      </T.Group>
    </T.Group>
  )
}
