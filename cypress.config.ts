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
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
