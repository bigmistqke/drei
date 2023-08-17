import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { StatsGl } from '../../src'

export default {
  title: 'Misc/StatsGl',
  component: StatsGl,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function Scene() {
  return (
    <>
      <T.AxesHelper />
      <StatsGl />
    </>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'
