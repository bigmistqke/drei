import { useFrame } from '@solid-three/fiber'
import { Accessor, createEffect, createRenderEffect, on, onCleanup } from 'solid-js'
import { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three'

type Api<T extends AnimationClip> = {
  ref: Accessor<Object3D | undefined | null>
  clips: AnimationClip[]
  mixer: AnimationMixer
  names: T['name'][]
  actions: { [key in T['name']]: AnimationAction | null }
}

export function useAnimations<T extends AnimationClip>(
  clips: T[],
  root?: Accessor<Object3D | undefined | null> | Object3D
) {
  const actualRef = () => (root ? (root instanceof Object3D ? root : root()) : undefined)
  // eslint-disable-next-line prettier/prettier
  const mixer = new AnimationMixer(undefined as unknown as Object3D)
  createRenderEffect(() => void ((mixer as any)._root = actualRef()), [mixer, root])
  let lazyActions = {}

  const api: Accessor<Api<T>> = () => {
    const actions = {} as { [key in T['name']]: AnimationAction | null }
    clips.forEach((clip) =>
      Object.defineProperty(actions, clip.name, {
        enumerable: true,
        get() {
          const ref = actualRef()
          if (ref) {
            return lazyActions[clip.name] || (lazyActions[clip.name] = mixer.clipAction(clip, ref))
          }
        },
        configurable: true,
      })
    )
    return { ref: actualRef, clips, actions, names: clips.map((c) => c.name), mixer }
  }

  useFrame((state, delta) => mixer.update(delta))
  createEffect(
    on(
      () => [clips],
      () => {
        const currentRoot = actualRef()
        onCleanup(() => {
          // Clean up only when clips change, wipe out lazy actions and uncache clips
          lazyActions = {}
          Object.values(api().actions).forEach((action) => {
            if (currentRoot) {
              mixer.uncacheAction(action as AnimationClip, currentRoot)
            }
          })
        })
      }
    )
  )

  createEffect(
    on(
      () => [mixer],
      () => onCleanup(() => mixer.stopAllAction())
    )
  )

  return api
}
