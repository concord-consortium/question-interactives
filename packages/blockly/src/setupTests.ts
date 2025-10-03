/* eslint-disable @typescript-eslint/no-var-requires */
const enzyme = require("enzyme");
const Adapter = require("@wojtekmaj/enzyme-adapter-react-17");
import "@testing-library/jest-dom";
/* eslint-enable @typescript-eslint/no-var-requires */

enzyme.configure({ adapter: new Adapter() });

// Mock window.alert
global.alert = jest.fn();

// https://www.benmvp.com/blog/quick-trick-jest-asynchronous-tests/
beforeEach(() => {
  // ensure there's at least one assertion run for every test case
  expect.hasAssertions();
});
