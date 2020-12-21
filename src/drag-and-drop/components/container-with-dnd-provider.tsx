import React from "react";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { Container, IProps } from "./container";

export const ContainerWithDndProvider: React.FC<IProps> = (props) => {
  return (
    <DndProvider backend={TouchBackend} options={{enableMouseEvents: true}} >
      <Container {...props} />
    </DndProvider>
  );
};
