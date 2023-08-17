import type { StorybookConfig } from 'storybook-solidjs-vite'

const config: StorybookConfig = {
  staticDirs: ['./public'],
  stories: ['./stories/**/*.stories.{ts,tsx}'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-knobs'],
  framework: {
    name: 'storybook-solidjs-vite',
    options: {},
  },
  docs: {
    autodocs: true,
  },
}
export default config
