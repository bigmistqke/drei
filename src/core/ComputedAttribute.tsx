import { Instance, Primitive, ThreeProps } from '@solid-three/fiber'
import { ParentComponent, createRenderEffect, createSignal } from 'solid-js'
import { BufferAttribute, BufferGeometry } from 'three'
import { processProps } from '../helpers/processProps'

type Props = {
  compute: (geometry: BufferGeometry) => BufferAttribute
  name: string
}

/**
 * Used exclusively as a child of a BufferGeometry.
 * Computes the BufferAttribute by calling the `compute` function
 * and attaches the attribute to the geometry.
 */
export const ComputedAttribute: ParentComponent<Props & ThreeProps<'BufferAttribute'>> = (_props) => {
  const [props, rest] = processProps(_props, {}, ['compute', 'name'])

  const bufferAttribute = new BufferAttribute(new Float32Array(0), 1)

  const [primitive, setPrimitive] = createSignal<Instance<BufferAttribute>['object']>()

  createRenderEffect(() => {
    const parent = primitive()?.__r3f?.parent?.object
    if (!parent) return
    const attr = props.compute(parent)
    primitive()!.copy(attr)
  })

  return <Primitive ref={setPrimitive} object={bufferAttribute} attach={`attributes-${props.name}`} {...rest} />
}
