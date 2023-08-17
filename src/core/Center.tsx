import { T, ThreeProps } from '@solid-three/fiber'
import { createEffect } from 'solid-js'
import { Box3, Group, Sphere, Vector3 } from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'

export type OnCenterCallbackProps = {
  /** The next parent above <Center> */
  parent: THREE.Object3D
  /** The outmost container group of the <Center> component */
  container: THREE.Object3D
  width: number
  height: number
  depth: number
  boundingBox: THREE.Box3
  boundingSphere: THREE.Sphere
  center: THREE.Vector3
  verticalAlignment: number
  horizontalAlignment: number
  depthAlignment: number
}

export type CenterProps = {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
  front?: boolean
  back?: boolean
  /** Disable all axes */
  disable?: boolean
  /** Disable x-axis centering */
  disableX?: boolean
  /** Disable y-axis centering */
  disableY?: boolean
  /** Disable z-axis centering */
  disableZ?: boolean
  /** See https://threejs.org/docs/index.html?q=box3#api/en/math/Box3.setFromObject */
  precise?: boolean
  /** Callback, fires in the useLayoutEffect phase, after measurement */
  onCentered?: (props: OnCenterCallbackProps) => void
  /** Optional cacheKey to keep the component from recalculating on every render */
  cacheKey?: any
}

export const Center: RefComponent<Group, ThreeProps<'Group'> & CenterProps, true> = function Center(_props) {
  const [props, rest] = processProps(
    _props,
    {
      precise: true,
      cacheKey: 0,
    },
    [
      'ref',
      'children',
      'disable',
      'disableX',
      'disableY',
      'disableZ',
      'left',
      'right',
      'top',
      'bottom',
      'front',
      'back',
      'onCentered',
      'precise',
      'cacheKey',
    ]
  )

  let ref: Group = null!
  let outer: Group = null!
  let inner: Group = null!
  createEffect(() => {
    outer.matrixWorld.identity()
    const box3 = new Box3().setFromObject(inner, props.precise)
    const center = new Vector3()
    const sphere = new Sphere()
    const width = box3.max.x - box3.min.x
    const height = box3.max.y - box3.min.y
    const depth = box3.max.z - box3.min.z
    box3.getCenter(center)
    box3.getBoundingSphere(sphere)
    const vAlign = props.top ? height / 2 : props.bottom ? -height / 2 : 0
    const hAlign = props.left ? -width / 2 : props.right ? width / 2 : 0
    const dAlign = props.front ? depth / 2 : props.back ? -depth / 2 : 0

    outer.position.set(
      props.disable || props.disableX ? 0 : -center.x + hAlign,
      props.disable || props.disableY ? 0 : -center.y + vAlign,
      props.disable || props.disableZ ? 0 : -center.z + dAlign
    )

    // Only fire onCentered if the bounding box has changed
    if (typeof props.onCentered !== 'undefined') {
      props.onCentered({
        parent: ref.parent!,
        container: ref,
        width,
        height,
        depth,
        boundingBox: box3,
        boundingSphere: sphere,
        center: center,
        verticalAlignment: vAlign,
        horizontalAlignment: hAlign,
        depthAlignment: dAlign,
      })
    }
  })

  createImperativeHandle(props, () => ref)

  return (
    <T.Group ref={ref} {...rest}>
      <T.Group ref={outer}>
        <T.Group ref={inner}>{props.children}</T.Group>
      </T.Group>
    </T.Group>
  )
}
