import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("renders welcome message", () => {
  render(<App />);
  const heading = screen.getByText(/Welcome to Gaige's Food Hub/i);
  expect(heading).toBeInTheDocument();
});