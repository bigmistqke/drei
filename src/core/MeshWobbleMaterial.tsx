import { Primitive, ThreeProps, useFrame } from '@solid-three/fiber'
import { MeshStandardMaterial, MeshStandardMaterialParameters, Shader } from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

type WobbleMaterialType = ThreeProps<'MeshStandardMaterial'> & {
  time?: number
  factor?: number
  speed?: number
}

type Props = WobbleMaterialType & {
  speed?: number
  factor?: number
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      WobbleMaterialImpl: WobbleMaterialType
    }
  }
}

interface Uniform<T> {
  value: T
}

class WobbleMaterialImpl extends MeshStandardMaterial {
  _time: Uniform<number>
  _factor: Uniform<number>

  constructor(parameters: MeshStandardMaterialParameters = {}) {
    super(parameters)
    this.setValues(parameters)
    this._time = { value: 0 }
    this._factor = { value: 1 }
  }

  onBeforeCompile(shader: Shader) {
    shader.uniforms.time = this._time
    shader.uniforms.factor = this._factor

    shader.vertexShader = `
      uniform float time;
      uniform float factor;
      ${shader.vertexShader}
    `
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `float theta = sin( time + position.y ) / 2.0 * factor;
        float c = cos( theta );
        float s = sin( theta );
        mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
        vec3 transformed = vec3( position ) * m;
        vNormal = vNormal * m;`
    )
  }

  get time() {
    return this._time.value
  }

  set time(v) {
    this._time.value = v
  }

  get factor() {
    return this._factor.value
  }

  set factor(v) {
    this._factor.value = v
  }
}

export const MeshWobbleMaterial: RefComponent<any, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      speed: 1,
    },
    ['ref', 'speed']
  )

  const material = new WobbleMaterialImpl()
  useFrame((state) => material && (material.time = state.clock.getElapsedTime() * props.speed))
  return <Primitive object={material} ref={props.ref!} attach="material" {...rest} />
}
