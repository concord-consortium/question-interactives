import { defineConfig } from 'cypress'

export default defineConfig({
  video: false,
  fixturesFolder: false,
  defaultCommandTimeout: 8000,
  retries: 2,
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  projectId: '6pog58',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'e2e/**/*.{js,jsx,ts,tsx}',
    supportFile: 'support/e2e.js'
  },
  viewportHeight: 800,
  viewportWidth: 1000
})
