import _ from "lodash";
import {
  IPluginFunc,
  IPlugin,
  IPluginExecutionConfig,
  IDataEngine,
  IUINode
} from "UIEngine/typings";

/**
 * exclude data
 * @param dataEngine
 */
const callback: IPluginFunc = (dataEngine: IDataEngine, options?: any) => {
  const { source, data } = options;
  if (!source.source) {
    return data;
  }
  const dataSource: string = _.trimEnd(source.source, ":");
  const dataPath = dataSource.split(".");
  dataPath.pop();
  const extractedData = _.get(data, dataPath);
  dataEngine.requestOptions.params = extractedData;
  return true;
};

export const extract: IPlugin = {
  type: "data.request.before",
  weight: 199,
  callback,
  name: "extract"
};
