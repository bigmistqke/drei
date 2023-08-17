import { addAfterEffect, addEffect, useThree } from '@solid-three/fiber'
import { createEffect, createMemo, onCleanup, splitProps } from 'solid-js'
import Stats from 'stats-gl'

type Props = Partial<Stats> & {
  showPanel?: number
  className?: string
  parent?: HTMLElement
}

export function StatsGl(_props: Props) {
  const [props, rest] = splitProps(_props, ['className', 'parent'])

  const store = useThree()

  const stats = createMemo(() => {
    const stats = new Stats({
      ...rest,
    })
    stats.init(store.gl.domElement)
    return stats
  })

  createEffect(() => {
    if (stats) {
      const node = props.parent || document.body
      node?.appendChild(stats().container)
      if (props.className) stats().container.classList.add(...props.className.split(' ').filter((cls) => cls))
      const begin = addEffect(() => stats().begin())
      const end = addAfterEffect(() => stats().end())

      onCleanup(() => {
        node?.removeChild(stats().container)
        begin()
        end()
      })
    }
  })
  return null
}
