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
  removeDiff: number[],
): {
  parent: elementNodeType;
  current: elementNodeType;
  index: number;
} => {
  let parent = node;
  let current = node;
  let index = 0;
  route.forEach((value, idx) => {
    parent = current;
    index = value + removeDiff[idx];
    if (parent?.childNodes) {
      current = parent.childNodes.filter((child) => child.nodeName !== "DEL")[
        index
      ];
    }
  });
  return { current, parent, index };
};

const dmp = new DiffMatchPatch();

export function displayDiff(
  tree: elementNodeType,
  diff: diffType,
  options: DiffDOMOptions,
  removeDiff: number[],
) {
  const action = diff[options._const.action] as string | number;
  const route = diff[options._const.route] as number[];

  const info = getFromRoute(tree, route, removeDiff);
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
        parent.childNodes[index] = {
          nodeName: "DIFF",
          childNodes: [
            {
              nodeName: "DEL",
              childNodes: [diff[options._const.oldValue] as nodeType],
            },
            {
              nodeName: "INS",
              childNodes: [diff[options._const.newValue] as nodeType],
            },
          ],
        };
      }
      break;
    }
    case options._const.addTextElement: {
      if (parent.childNodes) {
        parent.childNodes[index] = {
          nodeName: "INS",
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
      if (parent.childNodes) {
        parent.childNodes[index] = {
          nodeName: "DIFF",
          childNodes: diffResult.map((d) => {
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
          }),
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
        parent.childNodes[index] = {
          nodeName: "DIFF",
          childNodes: [
            {
              nodeName: "DEL",
              childNodes: [current],
            },
            {
              nodeName: "INS",
              childNodes: [newNode],
            },
          ],
        };
      }
      break;
    }
    case options._const.removeAttribute: {
      const newNode = cloneDeep(current);
      const attribute = newNode.attributes || {};
      delete attribute[diff[options._const.name] as string];
      newNode.attributes = attribute;
      if (parent.childNodes) {
        parent.childNodes[index] = {
          nodeName: "DIFF",
          childNodes: [
            {
              nodeName: "DEL",
              childNodes: [current],
            },
            {
              nodeName: "INS",
              childNodes: [newNode],
            },
          ],
        };
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
        parent.childNodes[index] = {
          nodeName: "DIFF",
          childNodes: [
            {
              nodeName: "DEL",
              childNodes: [current],
            },
            {
              nodeName: "INS",
              childNodes: [newNode],
            },
          ],
        };
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
  const removeDiff = new Array<number>(
    Math.max(
      ...diffs.map((diff) => {
        const route = (diff as diffType)[options._const.route] as number[];
        return route.length;
      }),
    ),
  ).fill(0);

  const newTree = cloneDeep(tree);
  diffs.forEach((diff: Diff | diffType) => {
    displayDiff(newTree, diff as diffType, options, removeDiff);
  });
  return newTree;
}
