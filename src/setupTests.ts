/* eslint-disable @typescript-eslint/no-var-requires */
const enzyme = require("enzyme");
const Adapter = require("enzyme-adapter-react-16");
import "@testing-library/jest-dom";
/* eslint-enable @typescript-eslint/no-var-requires */

enzyme.configure({ adapter: new Adapter() });

// https://www.benmvp.com/blog/quick-trick-jest-asynchronous-tests/
beforeEach(() => {
  // ensure there's at least one assertion run for every test case
  expect.hasAssertions();
});
