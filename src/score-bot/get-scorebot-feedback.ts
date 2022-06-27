// Note that for local development, you need to have CORS proxy server running at http://localhost:8010.
// To install and run it:
// ```
// npm install -g local-cors-proxy
// lcp --proxyUrl https://api.concord.org/question-rater-staging
// ```
const apiEndpoint = {
  production: "https://api.concord.org/question-rater",
  staging: "https://api.concord.org/question-rater-staging",
  local: "http://localhost:8010/proxy"
};

const throwError = (msg: string) => {
  console.error(msg);
  throw new Error(msg);
};

const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return apiEndpoint.local;
  }
  if (window.location.pathname.includes("/branch/")) {
    return apiEndpoint.staging;
  }
  return apiEndpoint.production;
};

// Note that format of this request matches an old ETS API format and many parameters are actually not used by the
// the new API. That's why response ID is set to 999.
const getRequestXML = (itemId: string, answer: string) =>
  `<crater-request includeRNS="N">
    <client id="CONCORD"/>
    <items>
        <item id="${itemId}">
        <responses>
            <response id="999">
            <![CDATA[${answer}]]>
            </response>
        </responses>
        </item>
    </items>
    </crater-request>`;

// Example response:
// <crater-results>
//   <tracking id="12345"/>
//   <client id="CONCORD"/>
//   <items>
//     <item id="WaterVernalRationale">
//       <responses>
//         <response id="999" score="4"/>
//       </responses>
//     </item>
//   </items>
// </crater-results>
const getScore = (responseXML: string) => {
  const matchResult = responseXML.match(/score="(\d+)"/);
  const score = matchResult && matchResult[1] ? Number(matchResult[1]) : NaN;
  if (isNaN(score)) {
    throwError("ScoreBOT response seems to be incorrect, can't find valid 'score' attribute.");
  }
  return score;
};

export const getScoreBOTFeedback = async (itemId: string, answer: string) => {
  const response = await fetch(getApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      "Accept": "application/xml"
    },
    mode: "cors",
    body: getRequestXML(itemId, answer)
  });
  const responseText = await response.text();
  return getScore(responseText);
};
