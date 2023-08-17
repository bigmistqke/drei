import { Canvas } from '@solid-three/fiber'
import { withKnobs } from '@storybook/addon-knobs'
import { Suspense, createContext, createSignal, useContext } from 'solid-js'

import { Box, OrbitControls, Text, useContextBridge } from '../../src'

export default {
  title: 'Misc/useContextBridge',
  component: useContextBridge,
  decorators: [(storyFn) => storyFn(), withKnobs],
}

type ThemeContext = { colors: { red: string; green: string; blue: string } }
type GreetingContext = {
  name: string
  setName: React.Dispatch<React.SetStateAction<T.String>>
}

const ThemeContext = createContext<ThemeContext>(null!)
const GreetingContext = createContext<GreetingContext>(null!)

function Scene() {
  // we can now use the context within the canvas via the regular hook
  const theme = useContext(ThemeContext)!
  const greeting = useContext(GreetingContext)!
  return (
    <>
      <Box
        position-x={-4}
        args={[3, 2]}
        material-color={theme.colors.red}
        onClick={() => greeting.setName(theme.colors.red)}
      />
      <Box
        position-x={0}
        args={[3, 2]}
        material-color={theme.colors.green}
        onClick={() => greeting.setName(theme.colors.green)}
      />
      <Box
        position-x={4}
        args={[3, 2]}
        material-color={theme.colors.blue}
        onClick={() => greeting.setName(theme.colors.blue)}
      />

      <Suspense fallback={null}>
        <Text fontSize={0.3} position-z={2}>
          {greeting.name ? `Hello ${greeting.name}!` : 'Click a color'}
        </Text>
      </Suspense>
    </>
  )
}

function SceneWrapper() {
  const ContextBridge = useContextBridge(ThemeContext, GreetingContext)
  return (
    <Canvas>
      {/* create the bridge inside the Canvas and forward the context */}
      <ContextBridge>
        <Scene />
        <OrbitControls enablePan={false} zoomSpeed={0.5} />
      </ContextBridge>
    </Canvas>
  )
}

function UseContextBridgeStory() {
  const [name, setName] = createSignal('')
  return (
    // Provide several contexts from above the Canvas
    // This mimics the standard behavior of composing them
    // in the `App.tsx` or `index.tsx` files
    <ThemeContext.Provider value={{ colors: { red: '#ff0000', green: '#00ff00', blue: '#0000ff' } }}>
      <GreetingContext.Provider
        value={{
          get name() {
            return name()
          },
          setName,
        }}
      >
        <SceneWrapper />
      </GreetingContext.Provider>
    </ThemeContext.Provider>
  )
}

export const UseContextBridgeSt = () => <UseContextBridgeStory />
UseContextBridgeSt.storyName = 'Default'
