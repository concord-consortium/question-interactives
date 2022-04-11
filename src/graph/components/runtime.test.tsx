import React from "react";
import {
  addLinkedInteractiveStateListener, IInteractiveStateWithDataset, removeLinkedInteractiveStateListener
} from "@concord-consortium/lara-interactive-api";
import { useContextInitMessage } from "../../shared/hooks/use-context-init-message";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { Bar } from "react-chartjs-2";
import { IAuthoredState } from "./types";
import { act } from "react-dom/test-utils";
import css from "./runtime.scss";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  addLinkedInteractiveStateListener: jest.fn(),
  removeLinkedInteractiveStateListener: jest.fn()
}));

const addLinkedInteractiveStateListenerMock = addLinkedInteractiveStateListener as jest.Mock;
const removeLinkedInteractiveStateListenerMock = removeLinkedInteractiveStateListener as jest.Mock;

jest.mock("../../shared/hooks/use-context-init-message", () => ({
  useContextInitMessage: jest.fn()
}));
const useContextInitMessageMock = useContextInitMessage as jest.Mock;

const authoredState: IAuthoredState = {
  version: 1,
  dataSourceInteractive1: "linkedInt1",
  dataSourceInteractive2: "linkedInt2"
};

const defaultLinkedState: IInteractiveStateWithDataset = {
  dataset: {
    type: "dataset",
    version: 1,
    properties: ["x", "y"],
    xAxisProp: "x",
    rows: [ [1, 1], [2, 2] ]
  }
};

const fakeDatasetUpdate = (index: number, intState: IInteractiveStateWithDataset) => {
  const listener1 = addLinkedInteractiveStateListenerMock.mock.calls[index][0];
  act(() => {
    listener1(intState);
  });
};

const initMessageWithDataSources = {
  mode: "runtime",
  linkedInteractives: [
    {
      id: "123-MwInteractive",
      label: "dataSourceInteractive1"
    },
    {
      id: "456-MwInteractive",
      label: "dataSourceInteractive2"
    }
  ]
};

const initMessageWithoutDataSources = {
  mode: "runtime",
  linkedInteractives: []
};

describe("Graph runtime", () => {
  beforeEach(() => {
    addLinkedInteractiveStateListenerMock.mockClear();
    removeLinkedInteractiveStateListenerMock.mockClear();
    useContextInitMessageMock.mockClear();
  });

  it("calls addLinkedInteractiveStateListener on mount and removeLinkedInteractiveStateListener for each observed source interactive", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
    const wrapper = mount(<Runtime authoredState={authoredState} />);
    expect(addLinkedInteractiveStateListenerMock).toHaveBeenCalledTimes(2);
    expect(addLinkedInteractiveStateListenerMock.mock.calls[0][1]).toEqual({interactiveItemId: "123-MwInteractive"});
    expect(addLinkedInteractiveStateListenerMock.mock.calls[1][1]).toEqual({interactiveItemId: "456-MwInteractive"});
    expect(removeLinkedInteractiveStateListener).toHaveBeenCalledTimes(0);
    wrapper.unmount();
    expect(removeLinkedInteractiveStateListenerMock).toHaveBeenCalledTimes(2);
    const listener1 = addLinkedInteractiveStateListenerMock.mock.calls[0][0];
    expect(removeLinkedInteractiveStateListenerMock).toHaveBeenCalledWith(listener1);
    const listener2 = addLinkedInteractiveStateListenerMock.mock.calls[1][0];
    expect(removeLinkedInteractiveStateListenerMock).toHaveBeenCalledWith(listener2);
  });

  it("renders empty graph when there's no data available yet", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithoutDataSources);
    const wrapper = mount(<Runtime authoredState={authoredState} />);
    expect(wrapper.find(Bar).length).toEqual(1);
  });

  it("renders two separate graphs when datasets cannot be merged", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
    const wrapper = mount(<Runtime authoredState={authoredState} />);
    const intState1: IInteractiveStateWithDataset = {
      dataset: {
        type: "dataset",
        version: 1,
        properties: ["x", "y"],
        xAxisProp: "x",
        rows: [ [1, 1], [2, 2] ]
      }
    };
    fakeDatasetUpdate(0, intState1);
    wrapper.update();
    expect(wrapper.find(Bar).length).toEqual(1);
    expect((wrapper.find(Bar).at(0).prop("data") as any).datasets.length).toEqual(1);

    const intState2: IInteractiveStateWithDataset = {
      dataset: {
        type: "dataset",
        version: 1,
        properties: ["x1", "y1"],
        xAxisProp: "x1",
        rows: [ [1, 1], [2, 2] ]
      }
    };
    fakeDatasetUpdate(1, intState2);
    wrapper.update();
    expect(wrapper.find(Bar).length).toEqual(2);
    expect((wrapper.find(Bar).at(1).prop("data") as any).datasets.length).toEqual(1);
  });

  it("renders one graph when two datasets can be merged", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
    const wrapper = mount(<Runtime authoredState={authoredState} />);
    fakeDatasetUpdate(0, defaultLinkedState);
    fakeDatasetUpdate(1, defaultLinkedState);
    wrapper.update();
    expect(wrapper.find(Bar).length).toEqual(1);
    expect((wrapper.find(Bar).at(0).prop("data") as any).datasets.length).toEqual(2);
  });

  it("ignores incompatible datasets", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
    const wrapper = mount(<Runtime authoredState={authoredState} />);
    const intStateWithWrongVersion = {
      dataset: {
        type: "dataset",
        version: 123,
        properties: ["x", "y"],
        xAxisProp: "x",
        rows: [ [1, 1], [2, 2] ]
      }
    };
    fakeDatasetUpdate(0, intStateWithWrongVersion as IInteractiveStateWithDataset);
    wrapper.update();
    expect(wrapper.find(Bar).length).toEqual(1);
  });

  it("respects graphsPerRow setting", () => {
    const graphsPerRow = 2;
    const customAuthoredState = {...authoredState, graphsPerRow};
    useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
    const wrapper = mount(<Runtime authoredState={customAuthoredState} />);
    fakeDatasetUpdate(0, defaultLinkedState);
    fakeDatasetUpdate(1, {
      dataset: {
        type: "dataset",
        version: 1,
        properties: ["x", "y1"], // make sure 2 graphs are rendered
        xAxisProp: "x",
        rows: [ [1, 1], [2, 2] ]
      }
    });
    wrapper.update();
    expect(wrapper.find(`.${css["graphLayout" + graphsPerRow]}`).length).toEqual(graphsPerRow);
  });
});
