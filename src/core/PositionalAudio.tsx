import { T, useLoader, useThree } from '@solid-three/fiber'
import { createEffect, onCleanup, onMount } from 'solid-js'
import { AudioListener, AudioLoader, PositionalAudio as PositionalAudioImpl } from 'three'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { when } from '../helpers/when'

type Props = Parameters<typeof T.PositionalAudio>[0] & {
  url: string
  distance?: number
  loop?: boolean
}

export const PositionalAudio: RefComponent<any, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      distance: 1,
      loop: true,
    },
    ['ref', 'url', 'distance', 'loop', 'autoplay']
  )

  let sound: PositionalAudioImpl
  const store = useThree()
  const listener = new AudioListener()
  const buffer = useLoader(AudioLoader, props.url)

  createEffect(() => {
    when(buffer)((buffer) => {
      sound.setBuffer(buffer)
      sound.setRefDistance(props.distance)
      sound.setLoop(props.loop)
      if (props.autoplay && !sound.isPlaying) sound.play()
    })
  })

  onMount(() => store.camera.add(listener))

  onCleanup(() => {
    store.camera.remove(listener)
    if (sound.isPlaying) sound.stop()
    if (sound.source && (sound.source as any)._connected) sound.disconnect()
  })
  return <T.PositionalAudio ref={sound!} args={[listener]} {...rest} />
}
