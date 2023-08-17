import { createThreeResource, useThree } from '@solid-three/fiber'
import { createEffect } from 'solid-js'
import * as THREE from 'three'
import { processProps } from '../helpers/processProps'

interface VideoTextureProps extends HTMLVideoElement {
  unsuspend?: 'canplay' | 'canplaythrough' | 'loadstart' | 'loadedmetadata'
  start?: boolean
}

export function useVideoTexture(src: string | MediaStream, _props?: Partial<VideoTextureProps>) {
  const [props, rest] = processProps(
    _props || {},
    {
      unsuspend: 'loadedmetadata',
      crossOrigin: 'Anonymous',
      muted: true,
      loop: true,
      start: true,
      playsInline: true,
    },
    ['unsuspend', 'crossOrigin', 'muted', 'loop', 'start', 'playsInline']
  )

  const store = useThree()
  const [texture] = createThreeResource(
    [src],
    () =>
      new Promise<THREE.VideoTexture>((res, rej) => {
        const video = Object.assign(document.createElement('video'), {
          src: (typeof src === 'string' && src) || undefined,
          srcObject: (src instanceof MediaStream && src) || undefined,
          crossOrigin: props.crossOrigin,
          loop: props.loop,
          muted: props.muted,
          ...rest,
        })
        const texture = new THREE.VideoTexture(video)
        if ('colorSpace' in texture) (texture as any).colorSpace = (store.gl as any).outputColorSpace
        else texture.encoding = store.gl.outputEncoding

        video.addEventListener(props.unsuspend, () => res(texture))
      })
  )
  createEffect(() => void (props.start && texture()?.image.play()))
  return texture
}
