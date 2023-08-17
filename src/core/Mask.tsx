import { T, ThreeProps } from '@solid-three/fiber'
import { createMemo, createRenderEffect } from 'solid-js'
import * as THREE from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'

type Props = Omit<ThreeProps<'Mesh'>, 'id'> & {
  /** Each mask must have an id, you can have compound masks referring to the same id */
  id: number
  /** If colors of the masks own material will leak through, default: false */
  colorWrite?: boolean
  /** If depth  of the masks own material will leak through, default: false */
  depthWrite?: boolean
}

export const Mask: RefComponent<THREE.Mesh, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      id: 1,
      colorWrite: false,
      depthWrite: false,
    },
    ['ref', 'id', 'colorWrite', 'depthWrite', 'renderOrder']
  )

  let ref: THREE.Mesh = null!
  const spread = createMemo(() => ({
    colorWrite: props.colorWrite,
    depthWrite: props.depthWrite,
    stencilWrite: true,
    stencilRef: props.id,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  }))
  createRenderEffect(() => {
    Object.assign(ref.material, spread())
  })
  createImperativeHandle(props, () => ref)
  return <T.Mesh ref={ref} renderOrder={-props.id} {...rest} />
}

// s3c:   useMask is not reactive right now
export function useMask(id: number, inverse: boolean = false) {
  return {
    stencilWrite: true,
    stencilRef: id,
    stencilFunc: inverse ? THREE.NotEqualStencilFunc : THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  }
}
