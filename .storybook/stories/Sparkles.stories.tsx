import { createMemo, splitProps } from 'solid-js'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { OrbitControls, PerspectiveCamera, Sparkles } from '../../src'

export default {
  title: 'Staging/Sparkles',
  component: Sparkles,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(1, 1, 1)} controls={false}>
        {storyFn()}
      </Setup>
    ),
  ],
}

// s3f:   Sparkles is not working currently
export const SparklesStory = (_props) => {
  const [props, rest] = splitProps(_props, ['random', 'size', 'amount'])

  const sizes = createMemo(() => {
    return new Float32Array(Array.from({ length: props.amount }, () => Math.random() * props.size))
  })

  return (
    <>
      <Sparkles {...rest} size={props.random ? sizes() : props.size} color="orange" count={props.amount} />
      <OrbitControls />
      <T.AxesHelper />
      <PerspectiveCamera position={[2, 2, 2]} makeDefault />
    </>
  )
}

SparklesStory.args = {
  size: 5,
  opacity: 1,
  amount: 100,
  speed: 0.3,
  noise: 1,
  random: true,
}

SparklesStory.argTypes = {
  amount: {
    control: {
      type: 'range',
      min: 0,
      max: 500,
      step: 1,
    },
  },
  noise: {
    control: {
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
  },
  size: {
    control: {
      type: 'range',
      min: 0,
      max: 10,
      step: 1,
    },
  },
  speed: {
    control: {
      type: 'range',
      min: 0,
      max: 20,
      step: 0.1,
    },
  },
  opacity: {
    control: {
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
  },
}

SparklesStory.storyName = 'Basic'
