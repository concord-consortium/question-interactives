import React from "react";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { Bar } from "react-chartjs-2";
import { DemoAuthoredState } from "./types";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import { useInitMessage, log } from "@concord-consortium/lara-interactive-api";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

const useInitMessageMock = useInitMessage as jest.Mock;
const logMock = log as jest.Mock;

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  log: jest.fn(),
  getClient: jest.fn().mockReturnValue({
    addListener: jest.fn()
  }),
}));

const initMessage = {
  mode: "runtime" as const,
};
useInitMessageMock.mockReturnValue(initMessage);

describe("Graph runtime", () => {
  beforeEach(() => {
    useInitMessageMock.mockClear();
  });

  it("renders a graph with the correct props", () => {
    const wrapper = mount(
      <InitMessageContext.Provider value={initMessage as any}>
        <DynamicTextTester>
          <Runtime authoredState={DemoAuthoredState} />
        </DynamicTextTester>
      </InitMessageContext.Provider>
    );
    expect(wrapper.find(Bar).length).toEqual(1);

    // NOTE: chart.js has an extensive test suite so the only thing we need
    // to test is if our mapping of the authored state to the props is working
    const props = wrapper.find(Bar).props() as any;
    delete props.options.plugins.chartInfo.callback;
    expect(props).toEqual({
      "options": {
        "animation": false,
        "responsive": true,
        "scales": {
          "x": {
            "title": {
              "display": false,
            },
            "ticks": {
              "font": {
                "size": 20,
                "family": "'Andika', sans-serif",
                "weight": undefined,
              },
              "color": "#3f3f3f"
            }
          },
          "y": {
            "type": "linear",
            "title": {
              "display": false,
            },
            "ticks": {
              "stepSize": 10
            },
            "beginAtZero": true,
            "max": 100
          }
        },
        "plugins": {
          "legend": {
            "display": false
          },
          "title": {
            "display": false,
          },
          "tooltip": {
            "enabled": false
          },
          "chartInfo": {
            // "callback": <-- deleted since this is a function variable
          }
        }
      },
      "data": {
        "labels": [
          "Winter",
          "Spring",
          "Summer",
          "Fall"
        ],
        "datasets": [
          {
            "data": [
              25,
              0,
              75,
              50
            ],
            "backgroundColor": [
              "#EA6D2F",
              "#FFC320",
              "#2DA343",
              "#6FC6DA"
            ]
          }
        ]
      }
    });
  });

  it("logs a init message at startup", () => {
    mount(
      <InitMessageContext.Provider value={initMessage as any}>
        <DynamicTextTester>
          <Runtime authoredState={DemoAuthoredState} />
        </DynamicTextTester>
      </InitMessageContext.Provider>
    );
    expect(logMock).toHaveBeenCalledWith("init bar chart", {barChart: DemoAuthoredState});
  });
});
