import { AgentSimulation } from "./agent-simulation";

jest.mock("@gjmcn/atomic-agents", () => {
  return {
    Simulation: jest.fn().mockImplementation((options) => ({
      options,
      end: jest.fn()
    }))
  };
});

describe("AgentSimulation model", () => {
    it("creates simulation with correct grid parameters", () => {
    const agentSim = new AgentSimulation(200, 150, 5);
    expect(agentSim.sim.options.width).toBe(200);
    expect(agentSim.sim.options.height).toBe(150);
    expect(agentSim.sim.options.gridStep).toBe(5);
  });

  it("initializes widgets array as empty", () => {
    const agentSim = new AgentSimulation(100, 100, 10);
    expect(Array.isArray(agentSim.widgets)).toBe(true);
    expect(agentSim.widgets.length).toBe(0);
  });

  it("addWidget adds widget to widgets array", () => {
    const agentSim = new AgentSimulation(100, 100, 10);
    const widget = { globalKey: "slider3", defaultValue: 33, type: "slider" };
    agentSim.addWidget(widget);
    expect(agentSim.widgets).toContainEqual(widget);
  });

  it("restores preserved globals on construction", () => {
    const preserved = { slider1: 10, readout1: 20 };
    const sim = new AgentSimulation(100, 100, 10, preserved);
    expect(sim.globals.get("slider1")).toBe(10);
    expect(sim.globals.get("readout1")).toBe(20);
  });

  it("does not overwrite existing globals when adding widgets", () => {
    const agentSim = new AgentSimulation(100, 100, 10);
    agentSim.globals.set("slider1", 55);
    agentSim.addWidget({ globalKey: "slider1", defaultValue: 99, type: "slider" });
    expect(agentSim.globals.get("slider1")).toBe(55);
  });

  it("sets default global if not present when adding widget", () => {
    const agentSim = new AgentSimulation(100, 100, 10);
    agentSim.addWidget({ globalKey: "slider2", defaultValue: 88, type: "slider" });
    expect(agentSim.globals.get("slider2")).toBe(88);
  });
});
