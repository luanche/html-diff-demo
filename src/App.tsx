import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { DiffDOM, nodeToObj } from "diff-dom";
import { objToNode } from "diff-dom/src/diffDOM/dom/fromVirtual";
import { displayDiffs } from "./utils";

const DefaultValue = `<h2>Header</h2>
<p>
  <strong>Interaction: </strong>Interacting with a game means that a telemetry
  event has been triggered. Telemetry events are a group of events coming from
  player or service telemetry systems. Supported telemetry events are listed in
  the Source section above.
</p>
<ul>
  <li>Daily: A day is considered to be a period of twenty-four hours</li>
  <li>
    Weekly: The&nbsp;start of the week is considered to be Monday and
  </li>
  <li>
    Weekly_USA:<strong>The start</strong> of the week is considered to be
    Sunday and the end of the week is considered to be Saturday
  </li>
</ul>
`;

function minifyHTML(html: string) {
  return html.trim().replace(/>\s+</g, "><").replace(/\s+/g, " ");
}

function App() {
  const [before, setBefore] = useState<string>(DefaultValue);
  const [after, setAfter] = useState<string>(DefaultValue);

  const [diff, setDiff] = useState<string>("");

  const diffDom = useMemo(() => {
    return new DiffDOM();
  }, []);

  useEffect(() => {
    const htmlObject1 = document.createElement("div");
    htmlObject1.innerHTML = minifyHTML(before);
    const obj1 = nodeToObj(htmlObject1);
    const htmlObject2 = document.createElement("div");
    htmlObject2.innerHTML = minifyHTML(after);
    const obj2 = nodeToObj(htmlObject2);
    // console.log(obj1, obj2);

    const diff = diffDom.diff(obj1, obj2);
    console.log(diff);
    const display = displayDiffs(obj1, diff, diffDom.options);
    console.log(display);
    document.getElementById("test")?.replaceChildren();
    document
      .getElementById("test")
      ?.appendChild(objToNode(display, false, diffDom.options));
  }, [before, after]);

  return (
    <>
      Before:
      <div style={{ display: "flex", marginBottom: 20 }}>
        <div style={{ width: "50%", marginRight: 20 }}>
          <textarea
            value={before}
            onChange={(e) => {
              setBefore(e.target.value);
            }}
            style={{ width: "100%", height: "100%", minHeight: 300 }}
          />
        </div>
        <div
          style={{ width: "50%" }}
          dangerouslySetInnerHTML={{ __html: before }}
        />
      </div>
      After:
      <div style={{ display: "flex", marginBottom: 20 }}>
        <div style={{ width: "50%", marginRight: 20 }}>
          <textarea
            value={after}
            onChange={(e) => {
              setAfter(e.target.value);
            }}
            style={{ width: "100%", height: "100%", minHeight: 300 }}
          />
        </div>
        <div
          style={{ width: "50%" }}
          dangerouslySetInnerHTML={{ __html: after }}
        />
      </div>
      <div dangerouslySetInnerHTML={{ __html: diff }}></div>
      <div className="diff" id="test"></div>
    </>
  );
}

export default App;
