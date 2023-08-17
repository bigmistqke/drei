import { boolean, optionsKnob, withKnobs } from '@storybook/addon-knobs'
import { Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { Object3D } from 'three'
import { OrbitControls as OrbitControlsImpl, TransformControls as TransformControlsImpl } from 'three-stdlib'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Box, OrbitControls, Select, TransformControls } from '../../src'

export function TransformControlsStory() {
  let ref: TransformControlsImpl

  createEffect(() => {
    const cb = (e: KeyboardEvent) => e.key === 'Escape' && ref.reset()
    document.addEventListener('keydown', cb)
    onCleanup(() => document.removeEventListener('keydown', cb))
  })

  return (
    <Setup>
      <TransformControls ref={ref!}>
        <Box>
          <T.MeshBasicMaterial wireframe />
        </Box>
      </TransformControls>
    </Setup>
  )
}

TransformControlsStory.storyName = 'Default'

export default {
  title: 'Gizmos/TransformControls',
  component: TransformControls,
}

export function TransformControlsSelectObjectStory() {
  const [selected, setSelected] = createSignal<Object3D[]>([])
  const active = () => selected()[0]

  return (
    <Setup controls={false}>
      <OrbitControls makeDefault />
      <Show when={active()}>
        <TransformControls object={active()} />
      </Show>
      <Select box onChange={setSelected}>
        <T.Group>
          <Box position={[-1, 0, 0]}>
            <T.MeshBasicMaterial wireframe color="orange" />
          </Box>
        </T.Group>
        <T.Group>
          <Box position={[0, 0, 0]}>
            <T.MeshBasicMaterial wireframe color="green" />
          </Box>
        </T.Group>
      </Select>
    </Setup>
  )
}

TransformControlsSelectObjectStory.storyName = 'With <Select />'

// s3f    I changed the implementation quite a lot
//        the implementation of r3f isn't working either
function TransformControlsLockScene(props) {
  let orbitControls: OrbitControlsImpl
  let transformControls: TransformControlsImpl
  const [orbitEnabled, setOrbitEnabled] = createSignal(true)

  onMount(() => {
    const callback = (event) => setOrbitEnabled(!event.value)
    transformControls.addEventListener('dragging-changed', callback)
    onCleanup(() => transformControls.removeEventListener('dragging-changed', callback))
  })

  return (
    <>
      <TransformControls
        ref={transformControls!}
        mode={props.mode}
        showX={props.showX}
        showY={props.showY}
        showZ={props.showZ}
      >
        <Box>
          <T.MeshBasicMaterial wireframe />
        </Box>
      </TransformControls>
      <OrbitControls ref={orbitControls!} enabled={orbitEnabled()} />
    </>
  )
}

export const TransformControlsLockSt = () => {
  const modesObj = {
    scale: 'scale',
    rotate: 'rotate',
    translate: 'translate',
  }

  return (
    <TransformControlsLockScene
      mode={optionsKnob('mode', modesObj, 'translate', {
        display: 'radio',
      })}
      showX={boolean('showX', true)}
      showY={boolean('showY', true)}
      showZ={boolean('showZ', true)}
    />
  )
}

TransformControlsLockSt.storyName = 'Lock orbit controls while transforming'
TransformControlsLockSt.decorators = [withKnobs, (storyFn) => <Setup controls={false}>{storyFn()}</Setup>]
