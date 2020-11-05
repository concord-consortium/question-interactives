import { IChoice, IAuthoredState as IMultipleChoiceAuthoredState } from "../multiple-choice/components/types";
import { IAuthoredState as IOpenResponseAuthoredState } from "../open-response/components/types";
import { IAuthoredState as IImageAuthoredState } from "../image/components/types";
import { IAuthoredState as IImageQuestionAuthoredState } from "../image-question/components/types";
import { IAuthoredState as IVideoPlayerAuthoredState } from "../video-player/components/types";

const convertMultipleChoice = (item: Record<string, any>, libraryInteractive: Record<string, any>) => {
  let choiceId = 1;
  const convertedChoices: IChoice[] = [];
  item.embeddable.choices.forEach((choice: Record<string, any>) => {
    const convertedChoice: IChoice = {
      id: `${choiceId}`,
      content: choice.choice,
      correct: choice.is_correct,
      choiceFeedback: choice.prompt
    };
    convertedChoices.push(convertedChoice);
    choiceId++;
  });

  const layout = item.embeddable.show_as_menu ? "Dropdown" : item.embeddable.layout;

  const authoredState: IMultipleChoiceAuthoredState = {
    version: 1,
    questionType: "multiple_choice",
    choices: convertedChoices,
    layout
  };

  const authoredStateProperties: Record<string, string> = {
    prompt: "prompt",
    enable_check_answer: "enableCheckAnswer",
    is_prediction: "required",
    multi_answer: "multipleAnswer",
    hint: "hint",
    give_prediction_feedback: "customFeedback",
    prediction_feedback: "predictionFeedback"
  };

  for (const key in authoredStateProperties) {
    if (item.embeddable[key]) {
      (authoredState as Record<string, any>)[authoredStateProperties[key]] = item.embeddable[key];
    }
  }

  item.embeddable.authored_state = JSON.stringify(authoredState).replace(/"/g, '"');
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);
};

const convertOpenResponse = (item: Record<string, any>, libraryInteractive: Record<string, any>) => {
  const authoredState: IOpenResponseAuthoredState = {
    version: 1,
    prompt: item.embeddable.prompt,
    defaultAnswer: item.embeddable.default_text,
    required: item.embeddable.is_prediction,
    questionType: "open_response",
    predictionFeedback: item.embeddable.give_prediction_feedback ? item.embeddable.prediction_feedback : undefined,
    hint: item.embeddable.hint
  };

  item.embeddable.authored_state = JSON.stringify(authoredState);
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);
};

const convertImage = (item: Record<string, any>, libraryInteractive: Record<string, any>) => {
  const authoredState: IImageAuthoredState = {
    version: 1,
    url: item.embeddable.url,
    caption: item.embeddable.caption,
    credit: item.embeddable.credit,
    creditLink: item.embeddable.credit_url,
    creditLinkDisplayText: "",
    allowLightbox: true
  };

  item.embeddable.authored_state = JSON.stringify(authoredState);
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);

};

const convertImageQuestion = (item: Record<string, any>, libraryInteractive: Record<string, any>) => {
  const authoredState: IImageQuestionAuthoredState = {
    version: 1,
    questionType: "image_question",
    required: item.embeddable.is_prediction,
    predictionFeedback: item.embeddable.prediction_feedback,
    backgroundImageUrl: item.embeddable.bg_url,
    imageFit: "shrinkBackgroundToCanvas",
    imagePosition: "center",
    answerPrompt: item.embeddable.drawing_prompt,
    prompt: item.embeddable.prompt,
    hint: item.embeddable.hint
  };

  item.embeddable.authored_state = JSON.stringify(authoredState);
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);

};

const convertVideoPlayer = (item: Record<string, any>, libraryInteractive: Record<string, any>) => {
  // get the MP4 version if present, otherwise take the first URL in the source array
  let videoSource = "";
  item.embeddable.sources.forEach((source: Record<string, any>) => {
    if (source.format === "video/mp4") {
      videoSource = source.url;
    }
  });
  if (videoSource === "") {
    videoSource = item.embeddable.sources[0].url;
  }

  const authoredState: IVideoPlayerAuthoredState = {
    version: 1,
    questionType: "iframe_interactive",
    videoUrl: videoSource,
    prompt: item.embeddable.caption,
    credit: item.embeddable.credit,
    creditLinkDisplayText: "",
    fixedHeight: item.embeddable.height,
    fixedAspectRatio: "",
    poster: item.embeddable.poster_url
  };

  item.embeddable.authored_state = JSON.stringify(authoredState);
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);

};

const setLibraryInteractive = (libraryInteractive: Record<string, any>) => {
  const libraryInteractiveProperties = {
    hash: libraryInteractive.export_hash,
    data: {
      aspect_ratio_method: libraryInteractive.data.aspect_ratio_method,
      authoring_guidance: libraryInteractive.data.authoring_guidance,
      base_url: libraryInteractive.data.base_url,
      click_to_play: libraryInteractive.data.click_to_play,
      click_to_play_prompt: libraryInteractive.data.click_to_play_prompt,
      description: libraryInteractive.data.description,
      enable_learner_state: libraryInteractive.data.enable_learner_state,
      full_window: libraryInteractive.data.full_window,
      has_report_url: libraryInteractive.data.has_report_url,
      image_url: libraryInteractive.data.image_url,
      name: libraryInteractive.data.name,
      native_height: libraryInteractive.data.native_height,
      native_width: libraryInteractive.data.native_width,
      no_snapshots: libraryInteractive.data.no_snapshots,
      show_delete_data_button: libraryInteractive.data.show_delete_data_button,
      thumbnail_url: libraryInteractive.data.thumbnail_url,
      customizable: libraryInteractive.data.customizable,
      authorable: libraryInteractive.data.authorable
    }
  };

  return libraryInteractiveProperties;
};

const deleteRedundantProperties = (item: Record<string, any>) => {
  // delete old, redundant properties
  delete item.embeddable.bg_source;
  delete item.embeddable.bg_url;
  delete item.embeddable.caption;
  delete item.embeddable.choices;
  delete item.embeddable.credit;
  delete item.embeddable.credit_url;
  delete item.embeddable.custom;
  delete item.embeddable.default_text;
  delete item.embeddable.drawing_prompt;
  delete item.embeddable.enable_check_answer;
  delete item.embeddable.give_prediction_feedback;
  delete item.embeddable.height;
  delete item.embeddable.hint;
  delete item.embeddable.is_prediction;
  delete item.embeddable.layout;
  delete item.embeddable.multi_answer;
  delete item.embeddable.poster_url;
  delete item.embeddable.prediction_feedback;
  delete item.embeddable.prompt;
  delete item.embeddable.show_as_menu;
  delete item.embeddable.sources;
  delete item.embeddable.url;
  delete item.embeddable.width;
};

const addNewProperties = (item: Record<string, any>, libraryInteractive: Record<string, any>) => {
  // add other new properties with default values
  item.embeddable.url_fragment = null;
  item.embeddable.inherit_aspect_ratio_method =	true;
  item.embeddable.custom_aspect_ratio_method = null;
  item.embeddable.inherit_native_width = true;
  item.embeddable.custom_native_width = libraryInteractive.native_width;
  item.embeddable.inherit_native_height = true;
  item.embeddable.custom_native_height = libraryInteractive.native_height;
  item.embeddable.inherit_click_to_play = true;
  item.embeddable.custom_click_to_play = false;
  item.embeddable.inherit_full_window = true;
  item.embeddable.custom_full_window = false;
  item.embeddable.inherit_click_to_play_prompt = true;
  item.embeddable.custom_click_to_play_prompt = null;
  item.embeddable.inherit_image_url = true;
  item.embeddable.custom_image_url = null;
  item.embeddable.linked_interactives = [];
  item.embeddable.type = "ManagedInteractive";
};

const updateEmbeddables = (embeddables: Record<string, any>, libraryInteractives: Record<string, any>) => {
  embeddables.forEach((item: Record<string, any>) => {
    switch (item.embeddable.type) {
      case "Embeddable::MultipleChoice":
        convertMultipleChoice(item, libraryInteractives.multiple_choice);
        deleteRedundantProperties(item);
        addNewProperties(item, libraryInteractives.multiple_choice);
        break;
      case "Embeddable::OpenResponse":
        convertOpenResponse(item, libraryInteractives.open_response);
        deleteRedundantProperties(item);
        addNewProperties(item, libraryInteractives.open_response);
        break;
      case "ImageInteractive":
        convertImage(item, libraryInteractives.image);
        deleteRedundantProperties(item);
        addNewProperties(item, libraryInteractives.image);
        break;
      case "VideoInteractive":
        convertVideoPlayer(item, libraryInteractives.video);
        deleteRedundantProperties(item);
        addNewProperties(item, libraryInteractives.video);
        break;
      case "Embeddable::ImageQuestion":
        convertImageQuestion(item, libraryInteractives.image_question);
        deleteRedundantProperties(item);
        addNewProperties(item, libraryInteractives.image_question);
        break;
    }
  });
};

const convert = async (laraResource: string, laraRoot: string, libraryInteractives: Record<string, any>) => {
  const convertButton = document.getElementById('convert-button');
  convertButton?.setAttribute("disabled", "true");
  convertButton && (convertButton.textContent = "Working. Please wait...");

  const resourceResponse = await fetch(laraResource);
  const resource = await resourceResponse.json();
  let newResourceName = "";

  if (resource.type === "Sequence") {
    newResourceName = "Activity Player Copy of " + resource.title;
    resource.title = newResourceName;
    resource.activities.forEach((activity: Record<string, any>) => {
      activity.pages.forEach((page: Record<string, any>) => {
        updateEmbeddables(page.embeddables, libraryInteractives);
      });
    });
  } else if (resource.type === "LightweightActivity") {
    // Change name to differentiate new resource from old
    newResourceName = "Activity Player Copy of " + resource.name;
    resource.name = newResourceName;
    resource.pages.forEach((page: Record<string, any>) => {
      updateEmbeddables(page.embeddables, libraryInteractives);
    });
  } else {
    throw new Error("Unknown resource type. Cannot convert.");
  }

  const location = laraRoot + "/api/v1/import";
  const settings: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify({
        import: resource
      })
  };

  const appElement = document.getElementById('app');
  try {
    const importResource = await fetch(location, settings);
    const data = await importResource.json();

    // download("import-test.json", JSON.stringify(resource));
    const viewUrl = data.url ? data.url : "#";
    const feedbackMsg = data.success ? "Conversion was successful. The new resource, " + newResourceName + " is available at " + viewUrl + "." : "Conversion failed.";
    appElement && (appElement.innerHTML = "");
    const feedback = document.createElement("p");
    feedback.textContent = feedbackMsg;
    const viewButton = document.createElement("button");
    viewButton.addEventListener("click", () => { window.open(viewUrl, "_blank"); });
    viewButton.textContent = "View";
    const editButton = document.createElement("button");
    editButton.addEventListener("click", () => { window.open(viewUrl + "/edit", "_blank"); });
    editButton.textContent = "Edit";
    appElement?.appendChild(feedback);
    if (data.success) {
      appElement?.appendChild(viewButton);
      appElement?.appendChild(editButton);
    }
  } catch (e) {
    appElement && (appElement.innerHTML = "");
    const error = document.createElement("p");
    document.getElementById('app')?.appendChild(error);
  }

};

(async function() {

  const searchParams = new URLSearchParams(window.location.search);
  const laraResourceParam = searchParams.get("lara_resource");
  const laraResource = laraResourceParam ? decodeURIComponent(laraResourceParam) : "";
  const laraRootParam = searchParams.get("lara_root");
  const laraRoot = laraRootParam ? decodeURIComponent(laraRootParam) : "";
  const resourceNameParam = searchParams.get("resource_name");
  const resourceName = resourceNameParam ? decodeURIComponent(resourceNameParam) : "";
  const templateParam = searchParams.get("template");
  const template = templateParam ? decodeURIComponent(templateParam) : "";

  if (laraResource === "") {
    throw new Error("Resource not provided.");
  }
  if (laraRoot === "") {
    throw new Error("Site root not provided.");
  }
  if (template === "") {
    throw new Error("Template not provided.");
  }

  // The template is an activity in LARA with one example of each library interactive embeddable.
  // We reference this to get information about the library interactives' settings in LARA.
  const laraTemplateResponse = template && await fetch(template);
  const laraTemplate = laraTemplateResponse && await laraTemplateResponse.json();

  const libraryInteractives: Record<string, any> = {};
  const qTypeMap: Record<string, string> = {
    "multiple_choice": "Multiple Choice",
    "open_response": "Open Response",
    "image": "Image Question",
    "video": "Video Player",
    "image_question": "Drawing Question"
  };

  laraTemplate.pages[0].embeddables.forEach((embeddable: Record<string, any>) => {
    const libraryInteractiveProperties = embeddable.embeddable.library_interactive;
    for (const property in qTypeMap) {
      const pattern = "^" + qTypeMap[property];
      const regex = new RegExp(pattern, "g");
      if (libraryInteractiveProperties.data.name.search(regex) !== -1) {
        libraryInteractives[property] = libraryInteractiveProperties;
      }
    }
  });

  const instructions = document.createElement("p");
  instructions.textContent = "Clicking the button below will create a new copy of " + resourceName + " that is compatible with the Activity Player.";
  const warningIntro = document.createElement("p");
  const warningIntroText = document.createElement("strong");
  warningIntroText.textContent = "Please note:";
  warningIntro.appendChild(warningIntroText);
  const warningList = document.createElement("ul");
  const warningListItem1 = document.createElement("li");
  warningListItem1.textContent = "No student data will be migrated.";
  const warningListItem2 = document.createElement("li");
  warningListItem2.textContent = "The original activity or sequence will remain as is at its existing URL.";
  warningList.appendChild(warningListItem1);
  warningList.appendChild(warningListItem2);
  const convertButton = document.createElement("button");
  convertButton.setAttribute("id", "convert-button");
  convertButton.addEventListener("click", () => { laraResource && laraRoot && convert(laraResource, laraRoot, libraryInteractives); });
  convertButton.textContent = "Create Activity Player Compatible Copy";
  document.getElementById('app')?.appendChild(instructions);
  document.getElementById('app')?.appendChild(warningIntro);
  document.getElementById('app')?.appendChild(warningList);
  document.getElementById('app')?.appendChild(convertButton);
})();

// THE FUNCTION BELOW IS CURRENTLY ONLY HERE FOR DEBUGGING PURPOSES
const download = (filename: string, text: string) => {  // eslint-disable-line @typescript-eslint/no-unused-vars
  const instructions = document.createElement("p");
  instructions.textContent = "Clicking the button below will create a new activity or sequence with library interactive versions of the old style embeddables. No student data will be migrated. The original activity or sequence will remain as is.";
  const downloadButton = document.createElement("a");
  downloadButton.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(text));
  downloadButton.setAttribute("download", filename);
  downloadButton.setAttribute("class", "button");
  downloadButton.textContent = "Convert";
  document.getElementById('app')?.appendChild(instructions);
  document.getElementById('app')?.appendChild(downloadButton);
};