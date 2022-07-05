import * as React from "react";
import styled from "styled-components";
import { createGlobalStyle } from "styled-components";
import { renderHTML } from "../../../shared/utilities/render-html";
import { Score } from "../score";

// Note that this component needs to be styled using styled-components (inline CSS) because it gets rendered
// to string and sent to Portal Report using postMessage.

// This body element style will be applied to inline iframe in Portal Report.
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
`;

const Container = styled.div`
  font-family: Lato;
  font-size: 16px;
  color: #3f3f3f;
  margin-top: 20px;

  &.outdated {
    .score, .feedback {
      opacity: 0.35;
    }
  }
`;

const OutdatedMsg = styled.div`
  padding: 5px 10px;
`;

const Header = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
`;

const ScoreValue = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  & > .value {
    font-weight: 500;
    margin-right: 8px;
  }
`;


const ScoreAndFeedbackContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-flow: row wrap;
`;

const ScoreContainer = styled.div`
  flex: 1;
  min-width: 300px;
  margin-right: 30px;
  margin-bottom: 10px;
`;

const FeedbackContainer = styled.div`
  flex: 10;
  min-width: 360px;
  font-size: 14px;
  font-weight: 400;
  p {
    margin: 3px 0;
  }
`;

interface IProps {
  score: number | null;
  attempts: number | null;
  feedback: string | null;
  maxScore: number | null;
  outdated: boolean;
}

export const FeedbackReport: React.FC<IProps> = ({ score, attempts, maxScore, feedback, outdated }) => {
  if (score === null || attempts === null  || maxScore === null  || feedback === null ) {
    // Feedback is configured incorrectly or not available yet. Just don't display anything.
    return null;
  }
  return (
    <Container className={outdated ? "outdated" : ""} data-cy="score-bot-feedback">
      <link href="https://fonts.googleapis.com/css2?family=Lato:wght@100;400;700;900&display=swap" rel="stylesheet" />
      <GlobalStyle />
      <Header>ScoreBOT Feedback</Header>
      <ScoreValue>Score: <span className="value">{ score }</span> Tries: <span className="value">{ attempts }</span></ScoreValue>
      { outdated && <OutdatedMsg>Student has not resubmitted their most recent answer. Feedback might not match the answer text.</OutdatedMsg> }
      <ScoreAndFeedbackContainer>
        <ScoreContainer><Score score={score} maxScore={maxScore} /></ScoreContainer>
        <FeedbackContainer>
          { renderHTML(feedback) }
        </FeedbackContainer>
      </ScoreAndFeedbackContainer>
    </Container>
  );
};
