// eslint-disable-next-line @typescript-eslint/no-var-requires
const enzyme = require("enzyme");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Adapter = require("enzyme-adapter-react-16");

enzyme.configure({ adapter: new Adapter() });
