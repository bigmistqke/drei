import { useFrame } from '@solid-three/fiber'
import { createSignal } from 'solid-js'
import * as THREE from 'three'
import { when } from '../src/helpers/when'

export function useTurntable() {
  // let turntable = { ref: null! as THREE.Mesh }
  const [turntable, setTurntable] = createSignal<THREE.Object3D>()
  useFrame(() => {
    when(turntable)((turntable) => {
      turntable.rotation.y += 0.01
    })
  })

  return setTurntable
}
