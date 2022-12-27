/*
  This is a modified version of the standard multiple choice question which uses the LARA interactive
  API showModal() function to show feedback via modal alert rather than inline feedback. At this point
  its sole purpose is to allow manual testing of the modal alert functionality.
 */

import React from "react";
import ReactDOM from "react-dom";
import { App } from "./components/app";

ReactDOM.render(
  <App/>,
  document.getElementById("app")
);
