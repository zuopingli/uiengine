import React from "react";
import _ from "lodash";
import { Form, Input } from "antd";
// import components from '../';
import { UIEngineRegister } from "UIEngine";

const { Item } = Form;

export const FormItem = (props: any) => {
  let { children, type, error, ...rest } = props;
  let element: any = children;
  if (type) {
    console.log(type);
    if (type.indexOf(":") === -1) type = "antd:" + _.upperFirst(type);
    const componentMap: any = UIEngineRegister.componentsLibrary;
    const [packageName, component] = type.split(":");
    const InputComponent: any = componentMap[packageName]
      ? componentMap[packageName][component]
      : componentMap[component];
    if (InputComponent) {
      element = <InputComponent {...rest} />;
    } else {
      element = <Input {...rest} />;
    }
  }

  let e = {};
  if (!_.get(error, "status", true)) {
    e = {
      validateStatus: _.isString(error.status) ? error.status : "error",
      help: error.code
    };
  }

  return (
    <Item {...rest} {...e}>
      {element}
    </Item>
  );
};
