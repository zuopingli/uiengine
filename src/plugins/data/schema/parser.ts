import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "../../../../typings";

/**
 * return this node's schema, this is default schema parser
 * use plugin cause' we don't know exactly the schema definition
 *
 * @param dataNode
 */
const callback: IPluginFunc = (dataNode: IDataNode) => {
  const rootSchema = dataNode.rootSchema;
  let schemaPath = dataNode.source.schema || dataNode.source.source;
  let name = schemaPath.replace(":", ".");
  const regex = /\[\d+\]/;
  name = name.replace(regex, "");
  return _.get(rootSchema, `definition.${name}`);
};

export const schemaParser: IPlugin = {
  type: "data.schema.parser",
  priority: 0,
  callback,
  name: "parse-schema"
};
