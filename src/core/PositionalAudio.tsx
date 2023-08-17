import { T, useLoader, useThree } from '@solid-three/fiber'
import { createEffect, onCleanup, onMount } from 'solid-js'
import { AudioListener, AudioLoader, PositionalAudio as PositionalAudioImpl } from 'three'
import { createRef } from '../helpers/createRef'
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
  const sound = createRef<PositionalAudioImpl>(null!)
  const store = useThree()
  const listener = new AudioListener()
  const buffer = useLoader(AudioLoader, props.url)

  createEffect(() => {
    when(buffer)((buffer) => {
      sound.ref.setBuffer(buffer)
      sound.ref.setRefDistance(props.distance)
      sound.ref.setLoop(props.loop)
      if (props.autoplay && !sound.ref.isPlaying) sound.ref.play()
    })
  })

  onMount(() => store.camera.add(listener))

  onCleanup(() => {
    store.camera.remove(listener)
    if (sound.ref) {
      if (sound.ref.isPlaying) sound.ref.stop()
      if (sound.ref.source && (sound.ref.source as any)._connected) sound.ref.disconnect()
    }
  })
  return <T.PositionalAudio ref={sound.ref} args={[listener]} {...rest} />
}
