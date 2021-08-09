/* eslint-disable @typescript-eslint/no-var-requires */
const enzyme = require("enzyme");
const Adapter = require("enzyme-adapter-react-16");
require("@testing-library/jest-dom");
/* eslint-enable @typescript-eslint/no-var-requires */

enzyme.configure({ adapter: new Adapter() });
