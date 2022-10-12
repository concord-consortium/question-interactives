import React from "react";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { Bar } from "react-chartjs-2";
import { DemoAuthoredState } from "./types";

describe("Graph runtime", () => {
  it("renders a graph with the correct props", () => {
    const wrapper = mount(<Runtime authoredState={DemoAuthoredState} />);
    expect(wrapper.find(Bar).length).toEqual(1);

    // NOTE: chart.js has an extensive test suite so the only thing we need
    // to test is if our mapping of the authored state to the props is working
    const props = wrapper.find(Bar).props() as any;
    delete props.options.plugins.barValues.callback;
    expect(props).toEqual({
      "options": {
        "responsive": true,
        "scales": {
          "x": {
            "title": {
              "display": true,
              "text": "Seasons",
              "font": {
                "size": 20,
                "family": "'Lato', sans-serif",
                "weight": "bold"
              },
              "color": "#3f3f3f"
            },
            "ticks": {
              "font": {
                "size": 20,
                "family": "'Lato', sans-serif"
              },
              "color": "#3f3f3f"
            }
          },
          "y": {
            "type": "linear",
            "title": {
              "display": false,
              "text": "Days of Sunlight",
              "font": {
                "size": 20,
                "family": "'Lato', sans-serif",
                "weight": "bold"
              },
              "color": "#3f3f3f"
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
            "display": true,
            "text": "Estimate Amount of Spring Sunlight",
            "font": {
              "size": 24,
              "family": "'Lato', sans-serif",
              "weight": "bold"
            },
            "color": "#3f3f3f"
          },
          "tooltip": {
            "enabled": false
          },
          "barValues": {
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
});
