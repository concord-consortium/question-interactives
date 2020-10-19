const convertMultipleChoice = (item, libraryInteractive) => {
  let choiceId = 1;
  let convertedChoice = {};
  const convertedChoices = [];
  item.embeddable.choices.forEach((choice) => {
    convertedChoice = {
      id: choiceId,
      content: choice.choice,
      correct: choice.is_correct,
      choiceFeedback: choice.prompt
    };
    convertedChoices.push(convertedChoice);
    choiceId++;
  });

  const layout = item.embeddable.show_as_menu ? "Dropdown" : item.embeddable.layout;

  const authoredState = {
    version: 1,
    questionType: "multiple_choice",
    choices: convertedChoices,
    layout
  };

  const authoredStateProperties = {
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
      authoredState[authoredStateProperties[key]] = item.embeddable[key];
    }
  }

  item.embeddable.authored_state = JSON.stringify(authoredState).replace(/"/g, '\"');
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);

};

const convertOpenResponse = (item, libraryInteractive) => {
  const authoredState = {
    version: 1,
    prompt: item.embeddable.prompt,
    defaultAnswer: item.embeddable.default_text,
    enableCheckAnswer: item.embeddable.enable_check_answer,
    layout: item.embeddable.layout,
    required: item.embeddable.is_prediction,
    questionType: "open_response",
    predictionFeedback: item.embeddable.prediction_feedback,
    hint: item.embeddable.hint,
    customFeedback: item.embeddable.give_prediction_feedback
  };

  item.embeddable.authored_state = JSON.stringify(authoredState);
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);

};

const convertImage = (item, libraryInteractive) => {
  const authoredState = {
    version: 1,
    scaling: "fitWidth",
    url: item.embeddable.url,
    caption: item.embeddable.caption,
    credit: item.embeddable.credit,
    creditLink: item.embeddable.credit_url,
    allowLightbox: true
  };

  item.embeddable.authored_state = JSON.stringify(authoredState);
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);

};

const convertImageQuestion = (item, libraryInteractive) => {
  const authoredState = {
    questionType: "iframe_interactive",
    required: item.embeddable.is_prediction,
    predictionFeedback: item.embeddable.prediction_feedback,
    backgroundImageUrl: item.embeddable.bg_url,
    imageFit: "shrinkBackgroundToCanvas",
    imagePosition: "center",
    answerPrompt: item.embeddable.prompt,
    prompt: item.embeddable.drawing_prompt,
    hint: item.embeddable.hint,
    customFeedback: item.embeddable.give_prediction_feedback
  };

  item.embeddable.authored_state = JSON.stringify(authoredState);
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);

};

const convertVideoPlayer = (item, libraryInteractive) => {
  // get the MP4 version if present, otherwise take the first URL in the source array
  let videoSource = "";
  item.embeddable.sources.forEach((source) => {
    if (source.format === "video/mp4") {
      videoSource = source.url;
    }
  });
  if (videoSource === "") {
    videoSource = item.embeddable.sources[0].url;
  }

  const authoredState = {
    questionType: "iframe_interactive",
    videoUrl: videoSource,
    prompt: item.embeddable.caption,
    credit: item.embeddable.credit,
    poster: item.embeddable.poster_url,
    fixedHeight: ""
  };

  item.embeddable.authored_state = JSON.stringify(authoredState);
  item.embeddable.library_interactive = setLibraryInteractive(libraryInteractive);

};

const setLibraryInteractive = (libraryInteractive) => {
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

const deleteRedundantProperties = (item) => {
  // delete old, redundant properties
  // use property name map(s) to use a loop for deleting these?
  delete item.embeddable.bg_source; // Does this need to be assigned to authoredState?
  delete item.embeddable.bg_url; // Does this need to be assigned to authoredState?
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

const addNewProperties = (item, libraryInteractive) => {
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

const updateEmbeddables = (embeddables, libraryInteractives) => {
  embeddables.forEach((item) => {
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

    // if (item.embeddable.type !== "Embeddable::Xhtml" && item.embeddable.type !== "ManagedInteractive") {
    //  deleteRedundantProperties(item);
    //  addNewProperties(item);
    // }

  });
};

const convert = async (laraResource, laraRoot, libraryInteractives) => {
  const resourceResponse = await fetch(laraResource);
  let resource = await resourceResponse.json();
  let newResourceName = "";

  if (resource.type === "Sequence") {
    newResourceName = "Activity Player Copy of " + resource.title;
    resource.title = newResourceName;
    resource.activities.forEach((activity) => {
      activity.pages.forEach((page) => {
        updateEmbeddables(page.embeddables, libraryInteractives);
      });
    });
  } else if (resource.type === "LightweightActivity") {
    // Change name to differentiate new resource from old
    newResourceName = "Activity Player Copy of " + resource.name;
    resource.name = newResourceName;
    resource.pages.forEach((page) => {
      updateEmbeddables(page.embeddables, libraryInteractives);
    });
  } else {
    throw new Error("Unknown resource type. Cannot convert.");
  }

  const location = laraRoot + "/api/v1/import";
  const settings = {
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

  try {
    const importResource = await fetch(location, settings);
    const data = await importResource.json();

    // download("import-test.json", JSON.stringify(resource));
    // tslint:disable-next-line:no-console
    // eslint-disable-next-line no-console
    // console.log(data);
    const viewUrl = data.url ? data.url : "#";
    const feedbackMsg = data.success ? "Conversion was successful. The new resource, " + newResourceName + " is available at " + viewUrl + "." : "Conversion failed.";
    document.getElementById('app').innerHTML = "";
    const feedback = document.createElement("p");
    feedback.textContent = feedbackMsg;
    const viewButton = document.createElement("a");
    viewButton.setAttribute("class", "button");
    viewButton.addEventListener("click", () => { window.open(viewUrl, "_blank"); });
    viewButton.textContent = "View";
    const editButton = document.createElement("a");
    editButton.setAttribute("class", "button");
    editButton.addEventListener("click", () => { window.open(viewUrl + "/edit", "_blank"); });
    editButton.textContent = "Edit";
    document.getElementById('app').appendChild(feedback);
    if (data.success) {
      document.getElementById('app').appendChild(viewButton);
      document.getElementById('app').appendChild(editButton);
    }
  } catch (e) {
    const errorMsg = "There was an error: " + e;
    document.getElementById('app').innerHTML = "";
    const error = document.createElement("p");
    document.getElementById('app').appendChild(error);
  }

};

(async function() {

  const searchParams = new URLSearchParams(window.location.search);
  const laraResource = searchParams.get("lara_resource");
  const laraRoot = searchParams.get("lara_root");
  const resourceName = searchParams.get("resource_name");
  const template = searchParams.get("template");

  // The template is an activity in LARA with one example of each library interactive embeddable. 
  // We reference this to get information about the library interactives' settings in LARA.
  const laraTemplateResponse = await fetch(template);
  const laraTemplate = await laraTemplateResponse.json();

  let libraryInteractives = {};
  const qTypeMap = {
    "multiple_choice": "Multiple Choice",
    "open_response": "Open Response",
    "image": "Image Question",
    "video": "Video Player",
    "image_question": "Drawing Question"
  };

  laraTemplate.pages[0].embeddables.forEach((embeddable) => {
    let libraryInteractiveProperties = embeddable.embeddable.library_interactive;
    for (const property in qTypeMap) {
      let pattern = "^" + qTypeMap[property];
      let regex = new RegExp(pattern,"g");
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
  const convertButton = document.createElement("a");
  convertButton.setAttribute("class", "button");
  convertButton.addEventListener("click", () => { convert(laraResource, laraRoot, libraryInteractives); });
  convertButton.textContent = "Create Activity Player Compatible Copy";
  document.getElementById('app').appendChild(instructions);
  document.getElementById('app').appendChild(warningIntro);
  document.getElementById('app').appendChild(warningList);
  document.getElementById('app').appendChild(convertButton);

})();

// THE FUNCTION BELOW IS CURRENTLY ONLY HERE FOR DEBUGGING PURPOSES
const download = (filename, text) => {
  const instructions = document.createElement("p");
  instructions.textContent = "Clicking the button below will create a new activity or sequence with library interactive versions of the old style embeddables. No student data will be migrated. The original activity or sequence will remain as is.";
  const downloadButton = document.createElement("a");
  downloadButton.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(text));
  downloadButton.setAttribute("download", filename);
  downloadButton.setAttribute("class", "button");
  downloadButton.textContent = "Convert";
  document.getElementById('app').appendChild(instructions);
  document.getElementById('app').appendChild(downloadButton);
};