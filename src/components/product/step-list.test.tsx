// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { StepList } from "./step-list";

afterEach(() => cleanup());

const steps = [
  { id: "step-1", instruction: "Write down who you want to see", status: "pending" },
  { id: "step-2", instruction: "Pick a day and a time", status: "done" },
];

describe("StepList", () => {
  test("an owner gets a button for each step and a sample view does not", () => {
    const { unmount } = render(
      <StepList
        taskId="task-1"
        steps={steps}
        canEdit
        doneLabel="Done"
        pendingLabel="Not done yet"
        markDone="Mark done"
        markNotDone="Mark not done"
      />,
    );
    expect(screen.getByRole("button", { name: "Mark done: Write down who you want to see" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mark not done: Pick a day and a time" })).toBeTruthy();
    unmount();

    render(
      <StepList
        taskId="task-1"
        steps={steps}
        canEdit={false}
        doneLabel="Done"
        pendingLabel="Not done yet"
        markDone="Mark done"
        markNotDone="Mark not done"
      />,
    );
    expect(screen.queryByRole("button", { name: /Mark done/ })).toBeNull();
    expect(screen.getByText("Write down who you want to see")).toBeTruthy();
  });
});
