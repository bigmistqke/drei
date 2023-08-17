import { extend, T, ThreeProps } from '@solid-three/fiber'
import { RefComponent } from '../helpers/typeHelpers'
import { DiscardMaterial as DiscardMaterialImpl } from '../materials/DiscardMaterial'

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      DiscardMaterialImpl: ThreeProps<'ShaderMaterial'>
    }
  }
}

export const MeshDiscardMaterial: RefComponent<THREE.ShaderMaterial, ThreeProps<'ShaderMaterial'>> = (props) => {
  extend({ DiscardMaterialImpl })
  return <T.DiscardMaterialImpl {...props} />
}
