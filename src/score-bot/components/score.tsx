import React from "react";
import classNames from "classnames";
import styled from "styled-components";
import PointerSVG from "../assets/pointer.svg";

// Note that this component needs to be styled using styled-components (inline CSS) because it gets rendered
// to string and sent to Portal Report using postMessage (see report-item).

const Container = styled.div`
  min-width: 200px;
  max-width: 400px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: italic;
  color: #3f3f3f;
`;

const Scale = styled.div`
  display: inline-flex;
  box-sizing: border-box;
  width: 100%;
  border-radius: 4px;
  border: solid 1px #333;
  position: relative;
`;

const Box = styled.div`
  height: 16px;

  &.scale-to-4 {
    width: calc(100% / 5);
  }
  &.scale-to-6 {
    width: calc(100% / 7);
  }

  &.color-0-4 { background-color: #020202; border-radius: 3px 0 0 3px; }
  &.color-1-4 { background-color: #be2325; }
  &.color-2-4 { background-color: #f8b113; }
  &.color-3-4 { background-color: #97cb45; }
  &.color-4-4 { background-color: #76a640; border-radius: 0 3px 3px 0; }

  &.color-0-6 { background-color: #020202; border-radius: 3px 0 0 3px; }
  &.color-1-6 { background-color: #be2325; }
  &.color-2-6 { background-color: #eb401a; }
  &.color-3-6 { background-color: #f8b113; }
  &.color-4-6 { background-color: #b0cc23; }
  &.color-5-6 { background-color: #97cb45; }
  &.color-6-6 { background-color: #76a640; border-radius: 0 3px 3px 0; }
`;

const Pointer = styled(PointerSVG)`
  position: absolute;
  top: 2px;
  margin-left: -12px;
`;

const Labels = styled.div`
  display: inline-flex;
  width: 100%;
`;

const Label = styled.div`
  text-align: center;
  width: 55px;

  &.scale-to-4 {
    width: calc(100% / 5);
  }
  &.scale-to-6 {
    width: calc(100% / 7);
  }
`;

interface IProps {
  score: number;
  maxScore: number;
}

export const Score: React.FC<IProps> = ({ score, maxScore }) => {
  const labels = maxScore === 6 ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
  return (
    <Container data-cy="score-bot-score">
      <Title>Level of Scientific Explanation</Title>
      <Scale>
        {
          labels.map(label => (
            <Box key={label} className={classNames(`scale-to-${maxScore}`, `color-${label}-${maxScore}`)} />
          ))
        }
        <Pointer style={{ left: `${((score + 0.5) / labels.length) * 100}%` }} />
      </Scale>
      <Labels>
        {
          labels.map(label => (
            <Label key={label} className={`scale-to-${maxScore}`} >{ label }</Label>
          ))
        }
      </Labels>
    </Container>
  );
};
