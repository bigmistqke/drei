import { T, useFrame } from '@solid-three/fiber'
import { createMemo, createSignal } from 'solid-js'
import { MathUtils, Vector3 } from 'three'
import { Cone, KeyboardControls, KeyboardControlsEntry, useKeyboardControls } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Controls/KeyboardControls',
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 10, 0)} lights={true}>
        {storyFn()}
      </Setup>
    ),
  ],
}

enum Controls {
  forward = 'forward',
  left = 'left',
  right = 'right',
  back = 'back',
  color = 'color',
}

export const KeyboardControlsSt = () => {
  const map = createMemo<KeyboardControlsEntry[]>(() => [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.color, keys: ['Space'] },
  ])

  const [color, setColor] = createSignal('green')

  return (
    <KeyboardControls
      map={map()}
      onChange={(name, pressed, _state) => {
        // Test onChange by toggling the color.
        if (name === Controls.color && pressed) {
          setColor((color) => (color === 'green' ? 'red' : 'green'))
        }
      }}
    >
      <Player color={color()} />
    </KeyboardControls>
  )
}

const _velocity = new Vector3()
const speed = 10

type PlayerProps = { color: string }

const Player = ({ color }: PlayerProps) => {
  let ref
  const [, state] = useKeyboardControls<Controls>()

  useFrame((_s, dl) => {
    if (!ref) return
    if (state.left && !state.right) _velocity.x = -1
    if (state.right && !state.left) _velocity.x = 1
    if (!state.left && !state.right) _velocity.x = 0

    if (state.forward && !state.back) _velocity.z = -1
    if (state.back && !state.forward) _velocity.z = 1
    if (!state.forward && !state.back) _velocity.z = 0

    ref.position.addScaledVector(_velocity, speed * dl)

    ref.rotateY(4 * dl * _velocity.x)
  })

  return (
    <Cone ref={ref} args={[1, 3, 4]} rotation={[-90 * MathUtils.DEG2RAD, 0, 0]}>
      <T.MeshLambertMaterial color={color} />
    </Cone>
  )
}
