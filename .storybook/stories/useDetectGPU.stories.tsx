import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Show } from 'solid-js'
import { Text, useDetectGPU } from '../../src'

export default {
  title: 'Misc/useDetectGPU',
  component: useDetectGPU,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function Simple() {
  const gpu = useDetectGPU()
  return (
    <Show when={gpu()}>
      {(gpu) => (
        <Text maxWidth={200}>
          | device {gpu().device} fps {gpu().fps} | gpu {gpu().gpu} isMobile {gpu().isMobile?.toString()} | Tier{' '}
          {gpu().tier.toString()} Type {gpu().type} |
        </Text>
      )}
    </Show>
  )
}

export const DefaultStory = () => (
  <T.Suspense fallback={null}>
    <Simple />
  </T.Suspense>
)
DefaultStory.storyName = 'Default'
