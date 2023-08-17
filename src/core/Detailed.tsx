import { T, ThreeProps, useFrame } from '@solid-three/fiber'
import { createEffect } from 'solid-js'
import { LOD } from 'three'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

type Props = ThreeProps<'LOD'> & {
  hysteresis?: number
  distances: number[]
}

export const Detailed: RefComponent<any, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      hysteresis: 0,
    },
    ['ref', 'children', 'hysteresis', 'distances']
  )
  const lodRef = createRef<LOD>(null!)
  createEffect(() => {
    lodRef.ref.levels.length = 0
    lodRef.ref.children.forEach((object, index) =>
      lodRef.ref.levels.push({ object, hysteresis: props.hysteresis, distance: props.distances[index] })
    )
  })
  useFrame((state) => lodRef.ref.update(state.camera))
  return (
    <T.LOD ref={mergeRefs(lodRef, props)} {...rest}>
      {props.children}
    </T.LOD>
  )
}
