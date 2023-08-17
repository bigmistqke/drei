import { Primitive, ThreeProps, useFrame } from '@solid-three/fiber'
import { MeshPhysicalMaterial, MeshPhysicalMaterialParameters, Shader } from 'three'
// eslint-disable-next-line
// @ts-ignore
import distort from '../helpers/glsl/distort.vert.glsl'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

type DistortMaterialType = ThreeProps<'MeshPhysicalMaterial'> & {
  time?: number
  distort?: number
  radius?: number
}

type Props = DistortMaterialType & {
  speed?: number
  factor?: number
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      DistortMaterialImpl: DistortMaterialType
    }
  }
}

interface Uniform<T> {
  value: T
}

class DistortMaterialImpl extends MeshPhysicalMaterial {
  _time: Uniform<number>
  _distort: Uniform<number>
  _radius: Uniform<number>

  constructor(parameters: MeshPhysicalMaterialParameters = {}) {
    super(parameters)
    this.setValues(parameters)
    this._time = { value: 0 }
    this._distort = { value: 0.4 }
    this._radius = { value: 1 }
  }

  onBeforeCompile(shader: Shader) {
    shader.uniforms.time = this._time
    shader.uniforms.radius = this._radius
    shader.uniforms.distort = this._distort

    shader.vertexShader = `
      uniform float time;
      uniform float radius;
      uniform float distort;
      ${distort}
      ${shader.vertexShader}
    `
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        float updateTime = time / 50.0;
        float noise = snoise(vec3(position / 2.0 + updateTime * 5.0));
        vec3 transformed = vec3(position * (noise * pow(distort, 2.0) + radius));
        `
    )
  }

  get time() {
    return this._time.value
  }

  set time(v) {
    this._time.value = v
  }

  get distort() {
    return this._distort.value
  }

  set distort(v) {
    this._distort.value = v
  }

  get radius() {
    return this._radius.value
  }

  set radius(v) {
    this._radius.value = v
  }
}

export const MeshDistortMaterial: RefComponent<any, Props> = (_props: Props) => {
  const [props, rest] = processProps(_props, { speed: 1 }, ['speed'])
  const material = new DistortMaterialImpl()
  useFrame((state) => material && (material.time = state.clock.getElapsedTime() * props.speed))
  return <Primitive object={material} attach="material" {...rest} />
}
