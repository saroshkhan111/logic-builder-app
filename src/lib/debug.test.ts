import { it } from "vitest";

import { suggestFileNames } from "./fileNameSuggester";

it("debug", () => {
  const combined =
    "write a program to check if a number is even or odd. num (int) \"even\" or \"odd\"";
  console.log("COMBINED:", JSON.stringify(combined));
  console.log("TEMP MATCH:", /celsius|fahrenheit|kelvin|temperature/.test(combined));
  console.log(
    "EVEN MATCH:",
    /even.?odd|oddeven|\beven\b|\bodd\b/.test(combined)
  );

  const names = suggestFileNames(
    "Write a program to check if a number is even or odd.",
    "",
    ["num (int)"],
    ['"even" or "odd"']
  );
  console.log("RESULT:", JSON.stringify(names));
});