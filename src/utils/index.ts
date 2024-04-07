import {
  DiffDOMOptions,
  diffType,
  elementNodeType,
  nodeType,
} from "diff-dom/src/diffDOM/types";
import { Diff } from "diff-dom/src/diffDOM/helpers";
import DiffMatchPatch from "diff-match-patch";

// ===== Display a diff =====

const cloneDeep = (value: any) => {
  return JSON.parse(JSON.stringify(value));
};

const getFromRoute = (
  node: elementNodeType,
  route: number[],
): {
  parent: elementNodeType;
  current: elementNodeType;
  index: number;
} => {
  let parent = node;
  let current = node;
  let index = 0;
  route.forEach((value) => {
    parent = current;
    index = value;
    if (parent?.childNodes) {
      for (let idx = 0, refIndex = 0; idx < parent.childNodes.length; idx++) {
        if (refIndex > index) break;
        const el = parent.childNodes[idx];
        if (el.nodeName !== "DEL") {
          current = el;
          refIndex++;
        }
      }
    }
  });
  return { current, parent, index };
};

const dmp = new DiffMatchPatch();

export function displayDiff(
  tree: elementNodeType,
  diff: diffType,
  options: DiffDOMOptions,
) {
  const action = diff[options._const.action] as string | number;
  const route = diff[options._const.route] as number[];

  const info = getFromRoute(tree, route);
  const { current, parent, index } = info;
  switch (action) {
    case options._const.addElement: {
      if (parent.childNodes) {
        parent.childNodes.splice(index, 0, {
          nodeName: "INS",
          childNodes: [diff[options._const.element] as nodeType],
        });
      }
      break;
    }
    case options._const.removeElement: {
      if (parent.childNodes) {
        parent.childNodes[index] = {
          nodeName: "DEL",
          childNodes: [diff[options._const.element] as nodeType],
        };
      }
      break;
    }
    case options._const.replaceElement: {
      if (parent.childNodes) {
        if (parent.childNodes) {
          parent.childNodes.splice(
            index,
            1,
            {
              nodeName: "DEL",
              childNodes: [diff[options._const.oldValue] as nodeType],
            },
            {
              nodeName: "INS",
              childNodes: [diff[options._const.newValue] as nodeType],
            },
          );
        }
      }
      break;
    }
    case options._const.addTextElement: {
      if (parent.childNodes) {
        parent.childNodes.splice(index, 0, {
          nodeName: "INS",
          childNodes: [
            {
              nodeName: "#text",
              data: diff[options._const.value] as string,
            },
          ],
        });
      }
      break;
    }
    case options._const.removeTextElement: {
      if (parent.childNodes) {
        parent.childNodes[index] = {
          nodeName: "DEL",
          childNodes: [
            {
              nodeName: "#text",
              data: diff[options._const.value] as string,
            },
          ],
        };
      }
      break;
    }
    case options._const.modifyTextElement: {
      if (!current || !(current.nodeName === "#text")) {
        return false;
      }
      const oldValue = diff[options._const.oldValue] as string;
      const newValue = diff[options._const.newValue] as string;
      const diffResult = dmp.diff_main(oldValue, newValue);
      dmp.diff_cleanupSemantic(diffResult);
      if (parent.childNodes) {
        const nodes = diffResult.map((d) => {
          const [type, value] = d;
          if (type === 1) {
            return {
              nodeName: "INS",
              childNodes: [
                {
                  nodeName: "#text",
                  data: value,
                },
              ],
            };
          }
          if (type === -1) {
            return {
              nodeName: "DEL",
              childNodes: [
                {
                  nodeName: "#text",
                  data: value,
                },
              ],
            };
          }
          return {
            nodeName: "#text",
            data: value,
          };
        });
        parent.childNodes[index] = {
          nodeName: "DIFF",
          childNodes: nodes,
        };
      }
      break;
    }
    case options._const.addAttribute: {
      const newNode = cloneDeep(current);
      const attribute = newNode.attributes || {};
      attribute[diff[options._const.name] as string] = diff[
        options._const.value
      ] as string;
      newNode.attributes = attribute;
      if (parent.childNodes) {
        parent.childNodes.splice(
          index,
          1,
          {
            nodeName: "DEL",
            childNodes: [current],
          },
          {
            nodeName: "INS",
            childNodes: [newNode],
          },
        );
      }
      break;
    }
    case options._const.removeAttribute: {
      const newNode = cloneDeep(current);
      const attribute = newNode.attributes || {};
      delete attribute[diff[options._const.name] as string];
      newNode.attributes = attribute;
      if (parent.childNodes) {
        parent.childNodes.splice(
          index,
          1,
          {
            nodeName: "DEL",
            childNodes: [current],
          },
          {
            nodeName: "INS",
            childNodes: [newNode],
          },
        );
      }
      break;
    }
    case options._const.modifyAttribute: {
      const newNode = cloneDeep(current);
      const attribute = newNode.attributes || {};
      attribute[diff[options._const.name] as string] = diff[
        options._const.newValue
      ] as string;
      newNode.attributes = attribute;
      if (parent.childNodes) {
        parent.childNodes.splice(
          index,
          1,
          {
            nodeName: "DEL",
            childNodes: [current],
          },
          {
            nodeName: "INS",
            childNodes: [newNode],
          },
        );
      }
      break;
    }
    case options._const.modifyValue:
    case options._const.modifyComment:
    case options._const.modifyChecked:
    case options._const.modifySelected:
      break;
    default:
      console.log("unknown action");
  }
  return true;
}

export function displayDiffs(
  tree: elementNodeType,
  diffs: (Diff | diffType)[],
  options: DiffDOMOptions,
) {
  if (!diffs.length) return tree;

  const newTree = cloneDeep(tree);
  diffs.forEach((diff: Diff | diffType) => {
    displayDiff(newTree, diff as diffType, options);
  });
  return newTree;
}
