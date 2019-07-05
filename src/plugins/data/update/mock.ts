import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "../../../../typings";

const callback: IPluginFunc = (dataNode: IDataNode) => {
  return {
    fake: "data"
  };
};

export const mock: IPlugin = {
  type: "data.commit",
  weight: 0,
  callback,
  name: "mock-data"
};