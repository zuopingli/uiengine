import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "UIEngine/typings";

/**
 * transfer the data schema to UI deps
 * and other possible used data
 *
 * @param dataNode
 */
const callback: IPluginFunc = (dataNode: IDataNode) => {
  const schema = dataNode.schema;
  if (schema) {
    // const toMergeSchema = {};
    // // condition turns to visible deps
    // let exclusions = _.get(schema, "cm-meta.m-exclusion");
    // if (_.isArray(exclusions)) {
    //   let deps = exclusions.map((ex: any) => {
    //     return {
    //       selector: {
    //         datasource: ex
    //       },
    //       comparerule: "empty",
    //       data: ""
    //     };
    //   });
    //   const depLine = "state.visible.deps";
    //   _.set(toMergeSchema, depLine, deps);
    // }
    // // merge ui schema
    // const uiSchema = dataNode.uiNode.schema;
    // _.merge(uiSchema, toMergeSchema);
  }
  return schema;
};

export const UISchemaFit: IPlugin = {
  type: "data.schema.parser",
  weight: 100,
  callback,
  name: "fit-ui-schema"
};