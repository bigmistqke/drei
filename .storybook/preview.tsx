import type { Preview } from 'storybook-solidjs'

import { Suspense } from 'solid-js'
import './index.css'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <Suspense fallback={null}>
        <Story />
      </Suspense>
    ),
  ],
}
export default preview
