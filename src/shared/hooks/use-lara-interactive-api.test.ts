import { renderHook, act } from "@testing-library/react-hooks";
import { useLARAInteractiveAPI } from "./use-lara-interactive-api";
import iframePhone from "iframe-phone";

const defConfig = { authoredState: true, interactiveState: true, aspectRatio: 1 };
const DefHookWrapper = () => useLARAInteractiveAPI(defConfig);

describe("useLARAInteractiveAPI", () => {
  beforeEach(() => {
    iframePhone._resetMock();
  });

  it("initializes iframePhone and sends config to LARA", () => {
    renderHook(DefHookWrapper);
    const phone = iframePhone.getIFrameEndpoint();
    expect(phone.addListener).toHaveBeenCalledWith("initInteractive", expect.anything());
    expect(phone.addListener).toHaveBeenCalledWith("getInteractiveState", expect.anything());
    expect(phone.post).toHaveBeenCalledWith("supportedFeatures", {
      apiVersion: 1,
      features: {
        authoredState: defConfig.authoredState,
        interactiveState: defConfig.interactiveState,
        aspectRatio: defConfig.aspectRatio
      }
    });
  });

  it("returns undefined as initial values of properties that require iframe-phone connection", () => {
    const { result } = renderHook(DefHookWrapper);
    expect(result.current.mode).toEqual(undefined);
    expect(result.current.authoredState).toEqual(undefined);
    expect(result.current.interactiveState).toEqual(undefined);
  });

  it("provides data coming from LARA after iframe-phone is initialized and initInteractive message received", () => {
    const { result } = renderHook(DefHookWrapper);
    const phone = iframePhone.getIFrameEndpoint();
    act(() => {
      phone._trigger("initInteractive", {
        mode: "runtime",
        // Note that states can be passed either using JS object or stringified JSON.
        interactiveState: {data: "intState"},
        authoredState: '{"data": "authoredState"}'
      });
    });
    expect(result.current.mode).toEqual("runtime");
    expect(result.current.authoredState).toEqual({data: "authoredState"});
    expect(result.current.interactiveState).toEqual({data: "intState"});
  });

  it("sends updated authored state back to LARA", () => {
    const { result } = renderHook(DefHookWrapper);
    const phone = iframePhone.getIFrameEndpoint();
    act(() => {
      result.current.setAuthoredState("newAuthoredState");
    });
    expect(phone.post).toHaveBeenCalledWith("authoredState", "newAuthoredState");
  });

  it("sends updated interactive state back to LARA", () => {
    const { result } = renderHook(DefHookWrapper);
    const phone = iframePhone.getIFrameEndpoint();
    act(() => {
      result.current.setInteractiveState("newInteractiveState");
    });
    expect(phone.post).toHaveBeenCalledWith("interactiveState", "newInteractiveState");
  });

  it("sends preffered interactive height back to LARA", () => {
    const { result } = renderHook(DefHookWrapper);
    const phone = iframePhone.getIFrameEndpoint();
    act(() => {
      result.current.setHeight(123);
    });
    expect(phone.post).toHaveBeenCalledWith("height", 123);
  });

  it("responds to getInteractiveState message", () => {
    const { result } = renderHook(DefHookWrapper);
    const phone = iframePhone.getIFrameEndpoint();
    act(() => {
      result.current.setInteractiveState("newInteractiveState");
    });
    expect(result.current.interactiveState).toEqual("newInteractiveState");
    act(() => {
      phone._trigger("getInteractiveState");
    });
    expect(phone.post).toHaveBeenCalledWith("interactiveState", "newInteractiveState");
  });
});
