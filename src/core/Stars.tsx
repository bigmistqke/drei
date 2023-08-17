import { createMemo } from 'solid-js'
// eslint-disable-next-line
import { Primitive, T, ThreeElement, useFrame } from '@solid-three/fiber'
import { AdditiveBlending, Color, ShaderMaterial, Spherical, Vector3 } from 'three'
import { defaultProps } from '../helpers/defaultProps'
import { RefComponent } from '../helpers/typeHelpers'

type Props = {
  radius?: number
  depth?: number
  count?: number
  factor?: number
  saturation?: number
  fade?: boolean
  speed?: number
}

class StarfieldMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: { time: { value: 0.0 }, fade: { value: 1.0 } },
      vertexShader: /* glsl */ `
      uniform float time;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
        gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
        gl_Position = projectionMatrix * mvPosition;
      }`,
      fragmentShader: /* glsl */ `
      uniform sampler2D pointTexture;
      uniform float fade;
      varying vec3 vColor;
      void main() {
        float opacity = 1.0;
        if (fade == 1.0) {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));
          opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
        }
        gl_FragColor = vec4(vColor, opacity);

        #include <tonemapping_fragment>
	      #include <encodings_fragment>
      }`,
    })
  }
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      StarfieldMaterial: ThreeElement<typeof StarfieldMaterial>
    }
  }
}

const genStar = (r: number) => {
  return new Vector3().setFromSpherical(new Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI))
}

export const Stars: RefComponent<any, Props> = (_props) => {
  const props = defaultProps(_props, {
    radius: 100,
    depth: 50,
    count: 5000,
    saturation: 0,
    factor: 4,
    fade: false,
    speed: 1,
  })

  let material: StarfieldMaterial
  const memo = createMemo(() => {
    const positions: any[] = []
    const colors: any[] = []
    const sizes = Array.from({ length: props.count }, () => (0.5 + 0.5 * Math.random()) * props.factor)
    const color = new Color()
    let r = props.radius + props.depth
    const increment = props.depth / props.count
    for (let i = 0; i < props.count; i++) {
      r -= increment * Math.random()
      positions.push(...genStar(r).toArray())
      color.setHSL(i / props.count, props.saturation, 0.9)
      colors.push(color.r, color.g, color.b)
    }
    return {
      position: new Float32Array(positions),
      color: new Float32Array(colors),
      size: new Float32Array(sizes),
    }
  })

  useFrame((state) => material && (material.uniforms.time.value = state.clock.getElapsedTime() * props.speed))

  const starfieldMaterial = new StarfieldMaterial()

  return (
    <T.Points ref={props.ref}>
      <T.BufferGeometry>
        <T.BufferAttribute attach="attributes-position" args={[memo().position, 3]} />
        <T.BufferAttribute attach="attributes-color" args={[memo().color, 3]} />
        <T.BufferAttribute attach="attributes-size" args={[memo().size, 1]} />
      </T.BufferGeometry>
      <Primitive
        ref={material!}
        object={starfieldMaterial}
        attach="material"
        blending={AdditiveBlending}
        uniforms-fade-value={props.fade}
        depthWrite={false}
        transparent
        vertexColors
      />
    </T.Points>
  )
}
