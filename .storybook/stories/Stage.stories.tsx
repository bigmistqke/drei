import { number, select, withKnobs } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { T } from '@solid-three/fiber'
import { Sphere, Stage } from '../../src'
import { PresetsType, presetsObj } from '../../src/helpers/environment-assets'
import { Setup } from '../Setup'

export default {
  title: 'Staging/Stage',
  component: Stage,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(2, 2, 3)}>{storyFn()}</Setup>],
}

enum presets {
  rembrant = 'rembrandt',
  portrait = 'portrait',
  upfront = 'upfront',
  soft = 'soft',
}

function StageStory() {
  const envPresets = Object.keys(presetsObj)
  const envPreset = select('Environment', envPresets, envPresets[0])
  const intensity = number('Intensity', 1)
  const presetKnob = select('Preset', presets, presets[0])

  return (
    <T.Suspense fallback={null}>
      <T.Color attach="background" args={['white']} />
      <Stage intensity={intensity} environment={envPreset as PresetsType} preset={presetKnob}>
        <Sphere args={[1, 64, 64]} position-z={0}>
          <T.MeshStandardMaterial roughness={0} color="royalblue" />
        </Sphere>
      </Stage>
    </T.Suspense>
  )
}

export const StageSt = () => <StageStory />
StageSt.story = {
  name: 'Default',
}
