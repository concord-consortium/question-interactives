import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";
import * as Component from "./runtime";
import { Runtime } from "./runtime";
import { IInteractiveState } from "./types";


const authoredState = {
  version: 1,
  questionType: "open_response" as const,
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: "",
  audioEnabled: false
};

const authoredRichState = {
  ...authoredState,
  prompt: "<p><strong>Rich</strong> <em>text</em> <u>prompt</u>"
};

const interactiveState: IInteractiveState = {
  answerType: "open_response_answer" as const,
  answerText: "Test answer"
};

const authoredStateWithAudioEnabled = {...authoredState, audioEnabled: true};
const savedAudioFileName = "test-audio.mp3";
const interactiveStateWithSavedAudio = {...interactiveState, audioFile: savedAudioFileName};

const mockGetUserMedia = jest.fn(
  async(params) => {
    return true;
  }
);
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn()
};
const mockStart = jest.fn(() => { return true; });
const mockStop = jest.fn(() => { return true; });
const mockPause = jest.fn(() => { return true; });
const mockPlay = jest.fn(() => { return true; });

Object.defineProperty(window.navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMedia
  }
});
Object.defineProperty(window, "MediaRecorder", {
  writable: true,
  value: jest.fn().mockImplementation(() => mockMediaRecorder)
});
Object.defineProperty(window.HTMLMediaElement.prototype, "start", {
  writable: true,
  value: mockStart
});
Object.defineProperty(window.HTMLMediaElement.prototype, "stop", {
  writable: true,
  value: mockStop
});
Object.defineProperty(window.HTMLAudioElement.prototype, "play", {
  writable: true,
  value: mockPlay
});
Object.defineProperty(window.HTMLAudioElement.prototype, "pause", {
  writable: true,
  value: mockPause
});

beforeEach(() => {
  jest.useFakeTimers();
  window.confirm = jest.fn(() => true) as jest.Mock<any>;
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("Runtime", () => {
  it("renders prompt and textarea", () => {
    render(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    const prompt = screen.getByTestId("legend");
    expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredState.prompt));
    expect(screen.getByTestId("response-textarea")).toBeDefined();
  });

  it("renders rich text prompt and textarea", () => {
    render(<DynamicTextTester><Runtime authoredState={authoredRichState} /></DynamicTextTester>);
    const prompt = screen.getByTestId("legend");
    expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredRichState.prompt));
    expect(screen.getByTestId("response-textarea")).toBeDefined();
  });

  it("handles passed interactiveState", () => {
    render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(screen.getByTestId("response-textarea")).toHaveValue(interactiveState.answerText);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} /></DynamicTextTester>);
    fireEvent.change(screen.getByTestId("response-textarea"), { target: { value: "new answer" } });
    const newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "open_response_answer", answerText: "new answer"});
  });

  it("does not render an audio record button if audioEnabled is false", () => {
    render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(screen.queryAllByTestId("audio-record-button")).toHaveLength(0);
    expect(screen.getByTestId("response-textarea")).toHaveAttribute("placeholder", "Please type your answer here.");
  });

  it("renders an audio record button if audioEnabled is true", () => {
    render(<DynamicTextTester><Runtime authoredState={authoredStateWithAudioEnabled} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(screen.getByTestId("audio-record-button")).toBeDefined();
    expect(screen.getByTestId("response-textarea")).toHaveAttribute("placeholder", "Please type your answer here, or record your answer using the microphone.");
  });

  it("allows user to record an audio response if audioEnabled is true", async () => {
    render(<DynamicTextTester><Runtime authoredState={authoredStateWithAudioEnabled} interactiveState={interactiveState} /></DynamicTextTester>);
    const recordButton = screen.getByTestId("audio-record-button");
    expect(recordButton).toBeDefined();
    // await waitFor(() => {
    //  fireEvent.click(recordButton);
    //  expect(MediaRecorder).toHaveBeenCalledTimes(1);
    //  // TODO: check if .start and .stop have been called, check if play, stop, and delete buttons appear after recording ended
    // });
  });

  it("loads a previously saved audio response", async () => {
    const mockFetchAudioUrl = jest.spyOn(Component, "fetchAudioUrl").mockResolvedValue(`https://concord.org/${savedAudioFileName}`);
    render(<DynamicTextTester><Runtime authoredState={authoredStateWithAudioEnabled} interactiveState={interactiveStateWithSavedAudio} /></DynamicTextTester>);
    expect(mockFetchAudioUrl).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("response-textarea")).toBeDefined();
    await waitFor(() => {
      const playButton = screen.getByTestId("audio-play-button");
      const stopButton = screen.getByTestId("audio-stop-button");
      const deleteButton = screen.getByTestId("audio-delete-button");
      const playbackTimerReadout = screen.getByTestId("playback-timer-readout");
      expect(playButton).toBeDefined();
      expect(stopButton).toBeDefined();
      expect(deleteButton).toBeDefined();
      expect(playbackTimerReadout).toBeDefined();
      expect(playbackTimerReadout).toHaveTextContent("00:00");
      fireEvent.click(playButton);
      expect(mockPlay).toHaveBeenCalledTimes(1);
      expect(playButton).toHaveAttribute("disabled");
      expect(stopButton).not.toHaveAttribute("disabled");
      fireEvent.click(stopButton);
      expect(mockPause).toHaveBeenCalledTimes(1);
      expect(playButton).not.toHaveAttribute("disabled");
      expect(stopButton).toHaveAttribute("disabled");
      fireEvent.click(deleteButton);
      expect(window.confirm).toHaveBeenCalledTimes(1);
    });
    mockFetchAudioUrl.mockRestore();
  });

  describe("report mode", () => {
    it("renders prompt and *disabled* textarea", () => {
      render(<DynamicTextTester><Runtime authoredState={authoredState} report={true} /></DynamicTextTester>);
      const prompt = screen.getByTestId("legend");
      expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredState.prompt));
      expect(screen.getByTestId("response-textarea")).toHaveAttribute("disabled");
    });

    it("handles passed interactiveState", () => {
      render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} /></DynamicTextTester>);
      expect(screen.getByTestId("response-textarea")).toHaveValue(interactiveState.answerText);
    });

    it("never calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} report={true} /></DynamicTextTester>);
      fireEvent.change(screen.getByTestId("response-textarea"), { target: { value: "diff answer" } });
      expect(setState).not.toHaveBeenCalled();
    });
  });
});
