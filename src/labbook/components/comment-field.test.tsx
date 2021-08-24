import React from "react";
import { render, screen } from "@testing-library/react";
import { CommentField, ICommentFieldProps } from "./comment-field";

describe("CommentField component", () => {
  const setComment = (comment:string) => { return; };

  it("renders a textarea in non-readOnly mode", () => {

    const props: ICommentFieldProps = {
      title: "A",
      comment: "Test comment",
      setComment,
      empty: false,
      readOnly: false
    };

    render(<CommentField {...props} />);
    expect(screen.getAllByTestId("comment-field")).toHaveLength(1);
    expect(screen.getAllByTestId("comment-field-textarea")).toHaveLength(1);
    expect(screen.queryAllByTestId("comment-field-text")).toHaveLength(0);
  });

  it("renders plain text in readOnly mode", () => {

    const props: ICommentFieldProps = {
      title: "A",
      comment: "Test comment",
      setComment,
      empty: false,
      readOnly: true
    };

    render(<CommentField {...props} />);
    expect(screen.getAllByTestId("comment-field")).toHaveLength(1);
    expect(screen.queryAllByTestId("comment-field-textarea")).toHaveLength(0);
    expect(screen.getAllByTestId("comment-field-text")).toHaveLength(1);
  });

  it("renders a no comment message in plain text in readOnly mode when the comment is empty", () => {

    const props: ICommentFieldProps = {
      title: "A",
      comment: "",
      setComment,
      empty: false,
      readOnly: true
    };

    render(<CommentField {...props} />);
    expect(screen.getAllByTestId("comment-field")).toHaveLength(1);
    expect(screen.queryAllByTestId("comment-field-textarea")).toHaveLength(0);
    expect(screen.getAllByTestId("comment-field-text")).toHaveLength(1);
    expect(screen.getAllByTestId("comment-field-text")[0]).toHaveTextContent("No comment.");
  });
});
