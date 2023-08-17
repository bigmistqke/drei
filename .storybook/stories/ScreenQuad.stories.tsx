import { T, ThreeProps, extend, useFrame, useThree } from '@solid-three/fiber'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { ScreenQuad, shaderMaterial } from '../../src'

export default {
  title: 'Shapes/ScreenQuad',
  component: ScreenQuad,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

const ColorShiftMaterial = shaderMaterial(
  { time: 0, resolution: new THREE.Vector2() },
  `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
  `,
  `
  uniform float time;
  uniform vec2 resolution;
  vec3 colorA = vec3(0.149,0.141,0.912);
  vec3 colorB = vec3(1.000,0.833,0.224);
  void main() {
    vec3 color = vec3(0.0);
    float pct = abs(sin(time));
    color = mix(colorA, colorB, pct);
    gl_FragColor = vec4(color,1.0);

    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }
  `
)

extend({ ColorShiftMaterial })

type ColorShiftMaterialImpl = {
  time: number
  resolution: number[]
} & ThreeProps<'ShaderMaterial'>

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      ColorShiftMaterial: ColorShiftMaterialImpl
    }
  }
}

function ScreenQuadScene() {
  const store = useThree()
  const ref: ColorShiftMaterialImpl = null!
  useFrame((state) => {
    if (ref?.uniforms) {
      ref.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <ScreenQuad>
      <T.ColorShiftMaterial ref={ref!} time={0} resolution={[store.size.width, store.size.height]} />
    </ScreenQuad>
  )
}

export const ScreenQuadSt = () => <ScreenQuadScene />
ScreenQuadSt.storyName = 'Default'
