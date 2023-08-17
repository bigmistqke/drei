import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { Stats } from '../../src'

export default {
  title: 'Misc/Stats',
  component: Stats,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function Scene() {
  return (
    <>
      <T.AxesHelper />
      <Stats />
    </>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'
