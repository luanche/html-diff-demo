import {
  DiffDOMOptions,
  diffType,
  elementNodeType,
  nodeType,
} from "diff-dom/src/diffDOM/types";
import { Diff } from "diff-dom/src/diffDOM/helpers";

// ===== Display a diff =====

const cloneDeep = (value: any) => {
  return JSON.parse(JSON.stringify(value));
};

const getFromRoute = (
  node: elementNodeType,
  route: number[],
  removeDiff: number[]
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
    if (parent?.childNodes) current = parent.childNodes[index];
  });
  return { parent, current, index };
};

export function displayDiff(
  tree: elementNodeType,
  diff: diffType,
  options: DiffDOMOptions,
  removeDiff: number[]
) {
  const action = diff[options._const.action] as string | number;
  const route = diff[options._const.route] as number[];

  // if (
  //   ![options._const.addElement, options._const.addTextElement].includes(action)
  // ) {
  //   // For adding nodes, we calculate the route later on. It's different because it includes the position of the newly added item.
  //   info = getFromRoute(tree, route);
  // }
  const info = getFromRoute(tree, route, removeDiff);
  console.log(info);
  const { current, parent, index } = info;
  switch (action) {
    case options._const.removeElement:
      if (parent.childNodes) {
        parent.childNodes[index] = {
          nodeName: "DEL",
          childNodes: [diff[options._const.element] as nodeType],
        };
      }
      removeDiff[route.length - 1]++;
      break;
    case options._const.replaceElement:
      if (parent.childNodes) {
        parent.childNodes[index] = {
          nodeName: "X",
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
    case options._const.addElement:
      if (parent.childNodes) {
        parent.childNodes.splice(index, 0, {
          nodeName: "INS",
          childNodes: [diff[options._const.element] as nodeType],
        });
      }
      break;
    case options._const.addTextElement:
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
    case options._const.modifyTextElement:
      if (!current || !(current.nodeName === "#text")) {
        return false;
      }
      if (parent.childNodes) {
        parent.childNodes[index] = {
          nodeName: "X",
          childNodes: [
            {
              nodeName: "DEL",
              childNodes: [
                {
                  nodeName: "#text",
                  data: diff[options._const.oldValue] as string,
                },
              ],
            },
            {
              nodeName: "INS",
              childNodes: [
                {
                  nodeName: "#text",
                  data: diff[options._const.newValue] as string,
                },
              ],
            },
          ],
        };
      }
      break;
    default:
      console.log("unknown action");
  }
  console.log(JSON.parse(JSON.stringify(tree)));
  return true;
}

export function displayDiffs(
  tree: elementNodeType,
  diffs: (Diff | diffType)[],
  options: DiffDOMOptions
) {
  if (!diffs.length) return tree;
  const removeDiff = new Array<number>(
    ...diffs.map((diff) => {
      const route = (diff as diffType)[options._const.route] as number[];
      return route.length;
    })
  ).fill(0);
  console.log(removeDiff);

  const newTree = cloneDeep(tree);
  diffs.forEach((diff: Diff | diffType) => {
    displayDiff(newTree, diff as diffType, options, removeDiff);
  });
  return newTree;
}
