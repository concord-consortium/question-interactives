import React from "react";
import { mount } from "enzyme";
import { Authoring } from "./authoring";
import { IAuthoredState } from "./types";
import { codapInitialData } from "../authoring-configs/codap-schema";

// Mock @rjsf/core — render nothing but capture props for assertions
let lastFormProps: any = null;
jest.mock("@rjsf/core", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactModule = require("react");
  const MockForm = ReactModule.forwardRef((props: any, _ref: any) => {
    lastFormProps = props;
    return ReactModule.createElement("div", { "data-testid": "mock-form" }, props.children);
  });
  MockForm.displayName = "MockForm";
  return { __esModule: true, default: MockForm };
});

// Mock @rjsf/validator-ajv8
jest.mock("@rjsf/validator-ajv8", () => ({
  __esModule: true,
  default: {}
}));

describe("Authoring", () => {
  const baseAuthoredState: IAuthoredState = {
    version: 1,
    questionType: "iframe_interactive"
  };

  beforeEach(() => {
    lastFormProps = null;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("with generic config", () => {
    it("renders the RJSF form", () => {
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="generic"
        />
      );
      expect(lastFormProps).not.toBeNull();
      expect(lastFormProps.schema).toBeDefined();
    });

    it("passes generic initialData as formData when no saved state", () => {
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="generic"
        />
      );
      expect(lastFormProps.formData).toEqual(
        expect.objectContaining({
          sourceUrl: "",
          enableFullscreen: true
        })
      );
    });

    it("uses saved authoringConfig.data when available", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "generic",
          version: 1,
          data: { sourceUrl: "https://saved.example.com", enableFullscreen: false }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="generic"
        />
      );
      expect(lastFormProps.formData.sourceUrl).toBe("https://saved.example.com");
      expect(lastFormProps.formData.enableFullscreen).toBe(false);
    });

    it("debounces onAuthoredStateChange calls", () => {
      const onChange = jest.fn();
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={onChange}
          authoringType="generic"
        />
      );

      // Simulate a form change
      lastFormProps.onChange({ formData: { sourceUrl: "https://new.example.com", enableFullscreen: true } });

      // Should not have called onChange yet (debounced)
      expect(onChange).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          wrappedInteractiveUrl: "https://new.example.com",
          authoringConfig: expect.objectContaining({
            type: "generic",
            data: expect.objectContaining({ sourceUrl: "https://new.example.com" })
          })
        })
      );
    });

    it("sets disableFullscreen based on enableFullscreen checkbox", () => {
      const onChange = jest.fn();
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={onChange}
          authoringType="generic"
        />
      );

      lastFormProps.onChange({ formData: { sourceUrl: "https://example.com", enableFullscreen: false } });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ disableFullscreen: true })
      );
    });
  });

  describe("with codap config", () => {
    it("renders with codap schema", () => {
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
        />
      );
      expect(lastFormProps.schema).toBeDefined();
      expect(lastFormProps.formData).toEqual(
        expect.objectContaining({
          codapSourceDocumentUrl: expect.any(String),
          displayFullscreenButton: true
        })
      );
    });

    it("parses existing wrappedInteractiveUrl to populate form", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        wrappedInteractiveUrl: "https://codap.concord.org/app?interactiveApi&documentId=doc&embeddedMode=yes"
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
        />
      );
      expect(lastFormProps.formData.removeToolbarsAndGrid).toBe(true);
    });

    it("builds URL when form changes and passes it to onAuthoredStateChange", () => {
      const onChange = jest.fn();
      // Start with an existing URL so source URL change re-parse doesn't override
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app#shared=doc123"
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      // Change form data (same source URL, just toggle a checkbox)
      const newData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app#shared=doc123",
        removeToolbarsAndGrid: true
      };
      lastFormProps.onChange({ formData: newData });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledTimes(1);
      const call = onChange.mock.calls[0][0];
      expect(call.wrappedInteractiveUrl).toContain("interactiveApi");
      expect(call.wrappedInteractiveUrl).toContain("embeddedMode=yes");
      expect(call.authoringConfig.type).toBe("codap");
    });
  });

  describe("with URL defaults and customs", () => {
    it("applies urlDefaults to initial form data", () => {
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="generic"
          urlDefaults={{ enableFullscreen: "false" }}
        />
      );
      expect(lastFormProps.formData.enableFullscreen).toBe(false);
    });

    it("does not apply urlDefaults when saved data exists", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "generic",
          version: 1,
          data: { sourceUrl: "https://saved.com", enableFullscreen: true }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="generic"
          urlDefaults={{ enableFullscreen: "false" }}
        />
      );
      // Saved data wins — enableFullscreen stays true
      expect(lastFormProps.formData.enableFullscreen).toBe(true);
    });

    it("applies urlCustoms to CODAP initial data", () => {
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
          urlCustoms={{ myParam: "myValue" }}
        />
      );
      expect(lastFormProps.formData.advancedOptions.enableCustomParams).toBe(true);
      expect(lastFormProps.formData.advancedOptions.customParamsValue).toContain("myParam=myValue");
    });

    it("does not apply urlCustoms when saved data exists", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: codapInitialData
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
          urlCustoms={{ myParam: "myValue" }}
        />
      );
      // Saved data wins — custom params not injected
      expect(lastFormProps.formData.advancedOptions.enableCustomParams).toBe(false);
    });
  });

  describe("unknown config type", () => {
    it("shows error message for unknown authoring type", () => {
      const wrapper = mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="nonexistent"
        />
      );
      expect(wrapper.text()).toContain("Unknown authoring type");
    });

    it("includes the type name in the error message", () => {
      const wrapper = mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="nonexistent"
        />
      );
      expect(wrapper.text()).toContain("nonexistent");
    });
  });

  describe("debounce behavior", () => {
    it("only fires the last change when multiple rapid changes occur", () => {
      const onChange = jest.fn();
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={onChange}
          authoringType="generic"
        />
      );

      // Simulate rapid changes
      lastFormProps.onChange({ formData: { sourceUrl: "https://first.com", enableFullscreen: true } });
      lastFormProps.onChange({ formData: { sourceUrl: "https://second.com", enableFullscreen: true } });
      lastFormProps.onChange({ formData: { sourceUrl: "https://third.com", enableFullscreen: true } });

      jest.advanceTimersByTime(500);

      // Only the last change should fire
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          wrappedInteractiveUrl: "https://third.com"
        })
      );
    });
  });

  describe("form validation", () => {
    it("passes extraErrors to form for non-CODAP URL (warning)", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://example.com/not-codap"
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
        />
      );
      // extraErrors should be set for non-CODAP URL (warning severity)
      expect(lastFormProps.extraErrors).toBeDefined();
    });

    it("passes extraErrors to form for malformed URL (error)", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "not-a-valid-url"
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
        />
      );
      // extraErrors should be set for malformed URL (error severity)
      expect(lastFormProps.extraErrors).toBeDefined();
    });

    it("does not pass extraErrors for valid CODAP URL", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app"
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
        />
      );
      expect(lastFormProps.extraErrors).toBeUndefined();
    });
  });

  describe("CODAP source URL change preserves independent settings", () => {
    it("preserves enableDi when pasting a URL without ?di= param", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app#shared=oldDoc",
            advancedOptions: {
              ...codapInitialData.advancedOptions,
              enableDi: true,
              diPluginUrl: "https://my-plugin.com",
            }
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      // Paste a new URL that doesn't have ?di=
      const newData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=newDoc",
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableDi: true,
          diPluginUrl: "https://my-plugin.com",
        }
      };
      lastFormProps.onChange({ formData: newData });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledTimes(1);
      const call = onChange.mock.calls[0][0];
      // enableDi and diPluginUrl should be preserved from current data
      expect(call.authoringConfig.data.advancedOptions.enableDi).toBe(true);
      expect(call.authoringConfig.data.advancedOptions.diPluginUrl).toBe("https://my-plugin.com");
    });

    it("preserves displayFullscreenButton when pasting a new URL", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app#shared=oldDoc",
            displayFullscreenButton: false,
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      const newData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=newDoc",
        displayFullscreenButton: false,
      };
      lastFormProps.onChange({ formData: newData });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledTimes(1);
      const call = onChange.mock.calls[0][0];
      expect(call.authoringConfig.data.displayFullscreenButton).toBe(false);
    });

    it("preserves custom params when pasting a new URL", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app#shared=oldDoc",
            advancedOptions: {
              ...codapInitialData.advancedOptions,
              enableCustomParams: true,
              customParamsValue: "myKey=myValue",
            }
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      const newData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=newDoc",
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableCustomParams: true,
          customParamsValue: "myKey=myValue",
        }
      };
      lastFormProps.onChange({ formData: newData });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledTimes(1);
      const call = onChange.mock.calls[0][0];
      expect(call.authoringConfig.data.advancedOptions.enableCustomParams).toBe(true);
      expect(call.authoringConfig.data.advancedOptions.customParamsValue).toBe("myKey=myValue");
    });

    it("re-parses form when source URL changes", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app#shared=oldDoc"
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      // Change the source URL to one with embeddedMode=yes
      const newData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=newDoc&embeddedMode=yes"
      };
      lastFormProps.onChange({ formData: newData });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledTimes(1);
      const call = onChange.mock.calls[0][0];
      // The re-parsed data should have removeToolbarsAndGrid=true from embeddedMode=yes
      expect(call.authoringConfig.data.removeToolbarsAndGrid).toBe(true);
    });
  });

  describe("defaults applied with wrappedInteractive URL (branch 2)", () => {
    it("applies urlDefaults on top of parsed wrappedInteractiveUrl", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        wrappedInteractiveUrl: "https://codap.concord.org/app?documentId=doc"
        // No authoringConfig — triggers branch 2 of computedFormData
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
          urlDefaults={{ "advancedOptions.enableDi": "true", "advancedOptions.diPluginUrl": "https://plugin.example.com" }}
        />
      );
      // Defaults should be applied on top of the parsed URL data
      expect(lastFormProps.formData.advancedOptions.enableDi).toBe(true);
      expect(lastFormProps.formData.advancedOptions.diPluginUrl).toBe("https://plugin.example.com");
    });

    it("applies urlCustoms on top of parsed wrappedInteractiveUrl", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        wrappedInteractiveUrl: "https://codap.concord.org/app?documentId=doc"
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
          urlCustoms={{ myParam: "myValue" }}
        />
      );
      expect(lastFormProps.formData.advancedOptions.enableCustomParams).toBe(true);
      expect(lastFormProps.formData.advancedOptions.customParamsValue).toContain("myParam=myValue");
    });

    it("does not apply urlDefaults when authoringConfig.data exists", () => {
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        wrappedInteractiveUrl: "https://codap.concord.org/app?documentId=doc",
        authoringConfig: {
          type: "codap",
          version: 1,
          data: { ...codapInitialData, codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=doc" }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="codap"
          urlDefaults={{ "advancedOptions.enableDi": "true" }}
        />
      );
      // Saved data wins — enableDi stays false
      expect(lastFormProps.formData.advancedOptions.enableDi).toBe(false);
    });
  });

  describe("handleChange uses computedFormData as merge fallback", () => {
    it("preserves defaults when pasting URL with no prior authoringConfig", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        wrappedInteractiveUrl: "https://codap.concord.org/app?documentId=oldDoc"
        // No authoringConfig — branch 2, defaults applied via computedFormData
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
          urlDefaults={{ "advancedOptions.enableDi": "true", "advancedOptions.diPluginUrl": "https://plugin.example.com" }}
        />
      );

      // Initial sync effect fires once (wrappedInteractiveUrl without authoringConfig)
      expect(onChange).toHaveBeenCalledTimes(1);

      // Verify defaults were applied to initial form data
      expect(lastFormProps.formData.advancedOptions.enableDi).toBe(true);
      expect(lastFormProps.formData.advancedOptions.diPluginUrl).toBe("https://plugin.example.com");

      // Clear initial call to isolate the paste-change call
      onChange.mockClear();

      // Paste a new URL (triggers source URL change → mergeWithParsedUrl)
      const newData = {
        ...lastFormProps.formData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=newDoc"
      };
      lastFormProps.onChange({ formData: newData });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledTimes(1);
      const call = onChange.mock.calls[0][0];
      // enableDi and diPluginUrl should be preserved from computedFormData (with defaults)
      expect(call.authoringConfig.data.advancedOptions.enableDi).toBe(true);
      expect(call.authoringConfig.data.advancedOptions.diPluginUrl).toBe("https://plugin.example.com");
    });
  });

  describe("computeFormData applied in handleChange", () => {
    it("populates generatedUrl in local form data after URL change", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app#shared=oldDoc"
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      // Change source URL
      const newData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=newDoc"
      };
      lastFormProps.onChange({ formData: newData });

      // After onChange, the local form data (shown in the form) should have generatedUrl set
      // because computeFormData is called before setLocalFormData
      expect(lastFormProps.formData.advancedOptions.generatedUrl).toBeTruthy();
      expect(lastFormProps.formData.advancedOptions.generatedUrl).toContain("codap.concord.org");
    });

    it("populates generatedUrl after toggling a checkbox", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app#shared=doc"
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      // Toggle a checkbox (same source URL, no re-parse)
      const newData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app#shared=doc",
        removeToolbarsAndGrid: true
      };
      lastFormProps.onChange({ formData: newData });

      // generatedUrl should be populated and include embeddedMode=yes
      expect(lastFormProps.formData.advancedOptions.generatedUrl).toContain("embeddedMode=yes");
    });
  });

  describe("initial sync effect", () => {
    it("syncs authored state on mount when wrappedInteractiveUrl exists but no authoringConfig", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        wrappedInteractiveUrl: "https://codap.concord.org/app?documentId=doc&embeddedMode=yes"
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      // The initial sync should fire immediately (useEffect)
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          authoringConfig: expect.objectContaining({
            type: "codap",
            version: 1
          })
        })
      );
    });

    it("does not sync on mount when authoringConfig already exists", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        wrappedInteractiveUrl: "https://codap.concord.org/app?documentId=doc",
        authoringConfig: {
          type: "codap",
          version: 1,
          data: codapInitialData
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      // No initial sync needed
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("form templates", () => {
    it("passes custom templates to the form", () => {
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="generic"
        />
      );
      expect(lastFormProps.templates).toBeDefined();
      expect(lastFormProps.templates.FieldErrorTemplate).toBeDefined();
      expect(lastFormProps.templates.ObjectFieldTemplate).toBeDefined();
    });

    it("sets liveValidate to false", () => {
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="generic"
        />
      );
      expect(lastFormProps.liveValidate).toBe(false);
    });

    it("sets showErrorList to false", () => {
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={jest.fn()}
          authoringType="generic"
        />
      );
      expect(lastFormProps.showErrorList).toBe(false);
    });
  });

  describe("generic config disableFullscreen in onChange", () => {
    it("sets disableFullscreen to false when enableFullscreen is true", () => {
      const onChange = jest.fn();
      mount(
        <Authoring
          authoredState={baseAuthoredState}
          onAuthoredStateChange={onChange}
          authoringType="generic"
        />
      );

      lastFormProps.onChange({ formData: { sourceUrl: "https://example.com", enableFullscreen: true } });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ disableFullscreen: false })
      );
    });
  });

  describe("CODAP config disableFullscreen in onChange", () => {
    it("sets disableFullscreen based on displayFullscreenButton", () => {
      const onChange = jest.fn();
      const authoredState: IAuthoredState = {
        ...baseAuthoredState,
        authoringConfig: {
          type: "codap",
          version: 1,
          data: {
            ...codapInitialData,
            codapSourceDocumentUrl: "https://codap.concord.org/app#shared=doc"
          }
        }
      };
      mount(
        <Authoring
          authoredState={authoredState}
          onAuthoredStateChange={onChange}
          authoringType="codap"
        />
      );

      const newData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app#shared=doc",
        displayFullscreenButton: false
      };
      lastFormProps.onChange({ formData: newData });
      jest.advanceTimersByTime(500);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ disableFullscreen: true })
      );
    });
  });
});
