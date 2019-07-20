import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "UIEngine/typings";
import validator from "validator";

const validationMap = {
  number: (value: any, schema: any) => {
    let opts;
    if (schema.range) {
      const [min, max] = schema.range.split("-");
      opts = { min: parseInt(min), max: parseInt(max) };
    }
    const status = validator.isInt(value, opts);
    return { status, code: status ? "" : "Number not correct" };
  },
  string: (value: any, schema: any) => {
    let status: any, code: any;
    if (schema.allowed && _.isArray(schema.allowed)) {
      const values = schema.allowed.map((option: any) =>
        option ? option.value : option
      );
      status = validator.isIn(value, values);
      code = !status ? "Value is not in range" : "";
    }
    return { status, code };
  },
  stringRlx: (value: any, schema: any) => {
    let status: any, code: any;
    let opts = {};
    if (schema.range) {
      const [min, max] = schema.range.split("-");
      opts = { min: parseInt(min), max: parseInt(max) };
    }
    status = validator.isLength(value, opts);
    code = !status ? "Value is not in range" : "";
    return { status, code };
  },
  ipv4Address: (value: any, schema: any) => {
    let status: any, code: any;
    status = validator.isIP(value, 4);
    code = !status ? "IPv4 Address not correct" : "";
    return { status, code };
  },
  ipv6Address: (value: any, schema: any) => {
    let status: any, code: any;
    status = validator.isIP(value, 6);
    code = !status ? "IPv6 Address not correct" : "";
    return { status, code };
  },
  ipv4NetmaskBrief: (value: any, schema: any) => {
    let status: any, code: any;
    // status = validator.isIP(value, 4);
    // code = !status ? "IPv6 Address not correct" : "";
    return { status, code };
  }
};

const callback: IPluginFunc = (dataNode: IDataNode) => {
  const data = dataNode.data;
  const meta = dataNode.getSchema("cm-meta");
  let result;

  if (meta && meta.format) {
    const format = _.camelCase(meta.format);
    const callback = _.get(validationMap, format);
    if (callback) {
      result = callback ? callback(data, meta) : {};
    }
  }
  return result;
};

export const most: IPlugin = {
  type: "data.update.could",
  weight: 100,
  callback,
  name: "most-from-validator-js"
};
