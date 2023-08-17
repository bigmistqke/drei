import { Primitive, SolidThreeFiber } from '@solid-three/fiber'
import { createRenderEffect } from 'solid-js'
import { Vector3 } from 'three'
import { Sky as SkyImpl } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

type Props = {
  distance?: number
  sunPosition?: SolidThreeFiber.Vector3
  inclination?: number
  azimuth?: number
  mieCoefficient?: number
  mieDirectionalG?: number
  rayleigh?: number
  turbidity?: number
}

export function calcPosFromAngles(inclination: number, azimuth: number, vector: Vector3 = new Vector3()) {
  const theta = Math.PI * (inclination - 0.5)
  const phi = 2 * Math.PI * (azimuth - 0.5)

  vector.x = Math.cos(phi)
  vector.y = Math.sin(theta)
  vector.z = Math.sin(phi)

  return vector
}

export const Sky: RefComponent<SkyImpl, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      inclination: 0.6,
      azimuth: 0.1,
      distance: 1000,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      rayleigh: 0.5,
      turbidity: 10,
    },
    [
      'ref',
      'inclination',
      'azimuth',
      'distance',
      'mieCoefficient',
      'mieDirectionalG',
      'rayleigh',
      'turbidity',
      'sunPosition',
    ]
  )

  const sunPosition = () => props.sunPosition || calcPosFromAngles(props.inclination, props.azimuth)

  const scale = new Vector3()
  createRenderEffect(() => scale.setScalar(props.distance))

  const sky = new SkyImpl()

  return (
    <Primitive
      object={sky}
      ref={props.ref}
      material-uniforms-mieCoefficient-value={props.mieCoefficient}
      material-uniforms-mieDirectionalG-value={props.mieDirectionalG}
      material-uniforms-rayleigh-value={props.rayleigh}
      material-uniforms-sunPosition-value={sunPosition()}
      material-uniforms-turbidity-value={props.turbidity}
      scale={scale}
      {...rest}
    />
  )
}
