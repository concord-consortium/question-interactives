import React from "react";
import {
  addLinkedInteractiveStateListener, IInteractiveStateWithDataset, removeLinkedInteractiveStateListener,
  createPubSubChannel
} from "@concord-consortium/lara-interactive-api";
import { useContextInitMessage } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { Bar, Line } from "react-chartjs-2";
import { IAuthoredState } from "./types";
import { act } from "react-dom/test-utils";
import css from "./runtime.scss";
import { ObjectStorageConfig, ObjectStorageProvider } from "@concord-consortium/object-storage";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  addLinkedInteractiveStateListener: jest.fn(),
  removeLinkedInteractiveStateListener: jest.fn(),
  createPubSubChannel: jest.fn(),
}));

const addLinkedInteractiveStateListenerMock = addLinkedInteractiveStateListener as jest.Mock;
const removeLinkedInteractiveStateListenerMock = removeLinkedInteractiveStateListener as jest.Mock;
const createPubSubChannelMock = createPubSubChannel as jest.Mock;

jest.mock("@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message", () => ({
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

const objectStorageConfig: ObjectStorageConfig = {
  version: 1,
  type: "demo",
};

describe("Graph runtime", () => {
  beforeEach(() => {
    addLinkedInteractiveStateListenerMock.mockClear();
    removeLinkedInteractiveStateListenerMock.mockClear();
    useContextInitMessageMock.mockClear();

    // Mock createPubSubChannel to return a mock channel
    const mockPubSubChannel = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    };
    createPubSubChannelMock.mockReturnValue(mockPubSubChannel);
  });

  it("calls addLinkedInteractiveStateListener on mount and removeLinkedInteractiveStateListener for each observed source interactive", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
    const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={authoredState} /></ObjectStorageProvider>);
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
    const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={authoredState} /></ObjectStorageProvider>);
    expect(wrapper.find(Bar).length).toEqual(1);
  });

  it("renders two separate graphs when datasets cannot be merged", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
    const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={authoredState} /></ObjectStorageProvider>);
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
    const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={authoredState} /></ObjectStorageProvider>);
    fakeDatasetUpdate(0, defaultLinkedState);
    fakeDatasetUpdate(1, defaultLinkedState);
    wrapper.update();
    expect(wrapper.find(Bar).length).toEqual(1);
    expect((wrapper.find(Bar).at(0).prop("data") as any).datasets.length).toEqual(2);
  });

  it("ignores incompatible datasets", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
    const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={authoredState} /></ObjectStorageProvider>);
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
    const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
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

  describe("graphType option", () => {
    it("renders a bar graph by default", () => {
      useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={authoredState} /></ObjectStorageProvider>);
      fakeDatasetUpdate(0, defaultLinkedState);
      wrapper.update();
      expect(wrapper.find(Bar).length).toEqual(1);
      expect(wrapper.find(Line).length).toEqual(0);
    });

    it("renders a bar graph when graphType is set to 'bar'", () => {
      const customAuthoredState = {...authoredState, graphType: "bar" as const};
      useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      fakeDatasetUpdate(0, defaultLinkedState);
      wrapper.update();
      expect(wrapper.find(Bar).length).toEqual(1);
      expect(wrapper.find(Line).length).toEqual(0);
    });

    it("renders a line graph when graphType is set to 'line'", () => {
      const customAuthoredState = {...authoredState, graphType: "line" as const};
      useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      fakeDatasetUpdate(0, defaultLinkedState);
      wrapper.update();
      expect(wrapper.find(Line).length).toEqual(1);
      expect(wrapper.find(Bar).length).toEqual(0);
    });

    it("renders line graphs for multiple datasets when graphType is 'line'", () => {
      const customAuthoredState = {...authoredState, graphType: "line" as const};
      useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      fakeDatasetUpdate(0, defaultLinkedState);
      fakeDatasetUpdate(1, {
        dataset: {
          type: "dataset",
          version: 1,
          properties: ["x", "y1"], // different properties to create separate graphs
          xAxisProp: "x",
          rows: [ [1, 3], [2, 4] ]
        }
      });
      wrapper.update();
      expect(wrapper.find(Line).length).toEqual(2);
      expect(wrapper.find(Bar).length).toEqual(0);
    });
  });

  describe("noDataMessage option", () => {
    it("does not display a message when noDataMessage is undefined and there is no data", () => {
      useContextInitMessageMock.mockReturnValue(initMessageWithoutDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={authoredState} /></ObjectStorageProvider>);
      expect(wrapper.find(`.${css.noDataMessage}`).length).toEqual(0);
      expect(wrapper.find(Bar).length).toEqual(1); // should show empty graph instead
    });

    it("does not display a message when noDataMessage is an empty string and there is no data", () => {
      const customAuthoredState = {...authoredState, noDataMessage: ""};
      useContextInitMessageMock.mockReturnValue(initMessageWithoutDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      expect(wrapper.find(`.${css.noDataMessage}`).length).toEqual(0);
      expect(wrapper.find(Bar).length).toEqual(1); // should show empty graph instead
    });

    it("displays custom no data message when there is no data", () => {
      const customMessage = "No data available yet";
      const customAuthoredState = {...authoredState, noDataMessage: customMessage};
      useContextInitMessageMock.mockReturnValue(initMessageWithoutDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      expect(wrapper.find(`.${css.noDataMessage}`).length).toEqual(1);
      expect(wrapper.find(`.${css.noDataMessage}`).text()).toEqual(customMessage);
      expect(wrapper.find(Bar).length).toEqual(0); // should not show empty graph
    });

    it("does not display no data message when data is available", () => {
      const customMessage = "No data available yet";
      const customAuthoredState = {...authoredState, noDataMessage: customMessage};
      useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      fakeDatasetUpdate(0, defaultLinkedState);
      wrapper.update();
      expect(wrapper.find(`.${css.noDataMessage}`).length).toEqual(0);
      expect(wrapper.find(Bar).length).toEqual(1);
    });

    it("hides no data message after data becomes available", () => {
      const customMessage = "No data available yet";
      const customAuthoredState = {...authoredState, noDataMessage: customMessage};
      useContextInitMessageMock.mockReturnValue(initMessageWithDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      // Initially no data, message should be shown
      expect(wrapper.find(`.${css.noDataMessage}`).length).toEqual(1);
      // Add data
      fakeDatasetUpdate(0, defaultLinkedState);
      wrapper.update();
      // Message should now be hidden
      expect(wrapper.find(`.${css.noDataMessage}`).length).toEqual(0);
      expect(wrapper.find(Bar).length).toEqual(1);
    });

    it("trims whitespace from noDataMessage", () => {
      const customMessage = "  No data available  ";
      const customAuthoredState = {...authoredState, noDataMessage: customMessage};
      useContextInitMessageMock.mockReturnValue(initMessageWithoutDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      expect(wrapper.find(`.${css.noDataMessage}`).length).toEqual(1);
      expect(wrapper.find(`.${css.noDataMessage}`).text()).toEqual(customMessage.trim());
    });

    it("does not display message when noDataMessage is only whitespace", () => {
      const customAuthoredState = {...authoredState, noDataMessage: "   "};
      useContextInitMessageMock.mockReturnValue(initMessageWithoutDataSources);
      const wrapper = mount(<ObjectStorageProvider config={objectStorageConfig}><Runtime authoredState={customAuthoredState} /></ObjectStorageProvider>);
      expect(wrapper.find(`.${css.noDataMessage}`).length).toEqual(0);
      expect(wrapper.find(Bar).length).toEqual(1); // should show empty graph instead
    });
  });
});
