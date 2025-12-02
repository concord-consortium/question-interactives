import React from "react";
import { render, screen } from "@testing-library/react";
import { ReadoutWidget, readoutWidgetType } from "./readout-widget";
import { IWidgetComponentProps } from "../types/widgets";

const mockSim = {
  globals: new Map([["energy", 42]])
};

function renderWidget(props: Partial<IWidgetComponentProps> = {}) {
  return render(
    <ReadoutWidget
      data={{ label: "Energy", unit: "J" }}
      globalKey="energy"
      sim={mockSim as any}
      type={readoutWidgetType}
      isRecording={props.isRecording ?? false}
      {...props}
    />
  );
}

describe("ReadoutWidget", () => {
  it("renders the label and value with unit", () => {
    renderWidget();

    expect(screen.getByText("Energy")).toBeInTheDocument();
    expect(screen.getByText("42 J")).toBeInTheDocument();
  });

  it("renders without unit if unit not provided", () => {
    renderWidget({ data: { label: "Energy" }, globalKey: "energy" });

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.queryByText("J")).not.toBeInTheDocument();
  });

  it("sanitizes the globalKey for id attributes", () => {
    renderWidget({ data: { label: "Energy" }, globalKey: "energy value!" });

    expect(screen.getByLabelText("Energy")).toBeInTheDocument();
    const label = screen.getByText("Energy");
    expect(label.id).toBe("label-energy_value_");
  });
});
