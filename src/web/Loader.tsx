import { Show, createEffect, createSignal, onCleanup } from 'solid-js'
import { useProgress } from '../core/useProgress'
import { defaultProps } from '../helpers/defaultProps'

interface LoaderOptions {
  containerStyles: any
  innerStyles: any
  barStyles: any
  dataStyles: any
  dataInterpolation: (p: number) => string
  initialState: (active: boolean) => boolean
}

const defaultDataInterpolation = (p: number) => `Loading ${p.toFixed(2)}%`

export function Loader(_props: Partial<LoaderOptions>) {
  const props = defaultProps(_props, {
    dataInterpolation: defaultDataInterpolation,
    initialState: (active: boolean) => active,
  })

  const progress = useProgress()
  let progressRef = 0
  let rafRef = 0
  let progressSpanRef: HTMLSpanElement = null!
  const [shown, setShown] = createSignal(props.initialState(progress.active))

  createEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (progress.active !== shown()) t = setTimeout(() => setShown(progress.active), 300)
    onCleanup(() => clearTimeout(t))
  })

  const updateProgress = () => {
    if (!progressSpanRef) return
    progressRef += (progress.progress - progressRef) / 2
    if (progressRef > 0.95 * progress.progress || progress.progress === 100) progressRef = progress.progress
    progressSpanRef.innerText = props.dataInterpolation(progressRef)
    if (progressRef < progress.progress) rafRef = requestAnimationFrame(updateProgress)
  }

  createEffect(() => {
    updateProgress()
    onCleanup(() => cancelAnimationFrame(rafRef))
  })

  return (
    <Show when={shown()}>
      <div style={{ ...styles.container, opacity: progress.active ? 1 : 0, ...props.containerStyles }}>
        <div>
          <div style={{ ...styles.inner, ...props.innerStyles }}>
            <div style={{ ...styles.bar, transform: `scaleX(${progress.progress / 100})`, ...props.barStyles }}></div>
            <span ref={progressSpanRef} style={{ ...styles.data, ...props.dataStyles }} />
          </div>
        </div>
      </div>
    </Show>
  )
}

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#171717',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    transition: 'opacity 300ms ease',
    'z-index': 1000,
  },
  inner: {
    width: 100,
    height: 3,
    background: '#272727',
    textAlign: 'center',
  },
  bar: {
    height: 3,
    width: '100%',
    background: 'white',
    transition: 'transform 200ms',
    'transform-origin': 'left center',
  },
  data: {
    display: 'inline-block',
    position: 'relative',
    'font-variant-numeric': 'tabular-nums',
    'margin-top': '0.8em',
    color: '#f0f0f0',
    'font-size': '0.6em',
    'font-family': `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Helvetica, Arial, Roboto, Ubuntu, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    whiteSpace: 'nowrap',
  },
}
