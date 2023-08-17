import { useFrame, useThree } from '@solid-three/fiber'
import { createEffect, onCleanup } from 'solid-js'
import { Euler } from 'three'
import { SimplexNoise } from 'three-stdlib'
import { defaultProps } from '../helpers/defaultProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'

export interface ShakeController {
  getIntensity: () => number
  setIntensity: (val: number) => void
}

type ControlsProto = {
  update(): void
  target: THREE.Vector3
  addEventListener: (event: string, callback: (event: any) => void) => void
  removeEventListener: (event: string, callback: (event: any) => void) => void
}

export interface CameraShakeProps {
  intensity?: number
  decay?: boolean
  decayRate?: number
  maxYaw?: number
  maxPitch?: number
  maxRoll?: number
  yawFrequency?: number
  pitchFrequency?: number
  rollFrequency?: number
}

export const CameraShake: RefComponent<ShakeController | undefined, CameraShakeProps> = (_props) => {
  const props = defaultProps(_props, {
    intensity: 1,
    decayRate: 0.65,
    maxYaw: 0.1,
    maxPitch: 0.1,
    maxRoll: 0.1,
    yawFrequency: 0.1,
    pitchFrequency: 0.1,
    rollFrequency: 0.1,
  })

  const store = useThree()
  let initialRotation: Euler = store.camera.rotation.clone()
  const yawNoise = new SimplexNoise()
  const pitchNoise = new SimplexNoise()
  const rollNoise = new SimplexNoise()

  const constrainIntensity = () => {
    if (props.intensity < 0 || props.intensity > 1) {
      props.intensity = props.intensity < 0 ? 0 : 1
    }
  }

  const methods = {
    getIntensity: (): number => props.intensity,
    setIntensity: (val: number): void => {
      props.intensity = val
      constrainIntensity()
    },
  }

  createImperativeHandle(props, () => methods)

  createEffect(() => {
    if (store.controls) {
      const callback = () => void (initialRotation = store.camera.rotation.clone())
      store.controls.addEventListener('change', callback)
      callback()
      onCleanup(() => {
        store.controls?.removeEventListener('change', callback)
      })
    }
  })

  useFrame((state, delta) => {
    const shake = Math.pow(props.intensity, 2)
    const yaw = props.maxYaw * shake * yawNoise.noise(state.clock.elapsedTime * props.yawFrequency, 1)
    const pitch = props.maxPitch * shake * pitchNoise.noise(state.clock.elapsedTime * props.pitchFrequency, 1)
    const roll = props.maxRoll * shake * rollNoise.noise(state.clock.elapsedTime * props.rollFrequency, 1)

    store.camera.rotation.set(initialRotation.x + pitch, initialRotation.y + yaw, initialRotation.z + roll)

    if (props.decay && props.intensity > 0) {
      props.intensity -= props.decayRate * delta
      constrainIntensity()
    }
  })

  return null
}
