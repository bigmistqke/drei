import { Primitive, T, ThreeProps } from '@solid-three/fiber'
import * as THREE from 'three'
import { RefComponent } from '../helpers/typeHelpers'

type PointMaterialType = Parameters<typeof T.PointsMaterial>[0]

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      PointMaterialImpl: PointMaterialType
    }
  }
}

export class PointMaterialImpl extends THREE.PointsMaterial {
  constructor(props) {
    super(props)
    this.onBeforeCompile = (shader, renderer) => {
      const { isWebGL2 } = renderer.capabilities
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <output_fragment>',
        `
        ${
          !isWebGL2
            ? '#extension GL_OES_standard_derivatives : enable\n#include <output_fragment>'
            : '#include <output_fragment>'
        }
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);
      float delta = fwidth(r);     
      float mask = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      gl_FragColor = vec4(gl_FragColor.rgb, mask * gl_FragColor.a );
      #include <tonemapping_fragment>
      #include <encodings_fragment>
      `
      )
    }
  }
}

export const PointMaterial: RefComponent<PointMaterialImpl, Omit<ThreeProps<'PointMaterialImpl'>, 'attach'>> = (
  props
) => {
  const material = new PointMaterialImpl(null)
  // s3f:   how should we type attach in Primitive?
  //        make it available when it's instanceof Geometry Material Attribute?
  return <Primitive {...props} object={material} ref={props.ref} attach="material" />
}
