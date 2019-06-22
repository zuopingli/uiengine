import _ from "lodash";
import { Request, DataNode, Cache, StateNode, PluginManager } from ".";
import { AxiosPromise } from "axios";
import * as uiPlugins from "../plugins/ui";
import {
  IDataNode,
  IStateNode,
  IUINode,
  ILayoutSchema,
  IRequest,
  IErrorInfo,
  IPluginManager,
  IPlugins
} from "../../typings";

export default class UINode implements IUINode {
  private request: IRequest = new Request();
  private dataNode?: any;
  private stateNode: IStateNode = new StateNode(this);
  private children: Array<UINode> = [];
  private pluginManager: IPluginManager = new PluginManager(this);
  private loadDefaultPlugins: boolean = true;
  errorInfo: IErrorInfo = {};
  schema: ILayoutSchema = {};
  rootName: string = "default";
  isLiveChildren: boolean = false;
  id: string = "";

  constructor(
    schema: ILayoutSchema,
    request?: IRequest,
    root: string = "default",
    loadDefaultPlugins: boolean = true
  ) {
    if (request) {
      this.request = request;
    }
    this.schema = schema;

    // cache root object if given root name
    if (root) {
      this.rootName = root;
    }

    // load plugins
    if (loadDefaultPlugins) {
      this.loadDefaultPlugins = loadDefaultPlugins;
      this.pluginManager.loadPlugins(uiPlugins);
    }
  }

  async loadLayout(schema?: ILayoutSchema | string) {
    // initial id
    this.id = _.uniqueId();

    // load remote node
    let returnSchema: any = schema;
    if (!returnSchema) returnSchema = this.schema;
    if (typeof schema === "string") {
      returnSchema = await this.loadRemoteLayout(schema);
      this.rootName = schema;
    }
    // assign the schema to this and it's children
    if (returnSchema) {
      await this.assignSchema(returnSchema);
    }

    // cache this node
    Cache.setUINode(this.rootName, this);
    return returnSchema;
  }

  getSchema(path?: string): ILayoutSchema {
    if (_.isEmpty(this.schema)) {
      console.warn("did you execute loadLayout before using getSchema method?");
    }
    if (path) {
      return _.get(this.schema, path);
    }
    return this.schema;
  }

  getErrorInfo(): IErrorInfo {
    return this.errorInfo;
  }

  getDataNode(): IDataNode {
    return this.dataNode;
  }

  getStateNode(): IStateNode {
    return this.stateNode;
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }

  getRequest(): IRequest {
    return this.request;
  }

  async loadRemoteLayout(url: string): Promise<AxiosPromise> {
    let result: any = Cache.getLayoutSchema(url);
    if (!result) {
      try {
        let response: any = await this.request.get(url);
        if (response.data) {
          result = response.data;
          Cache.setLayoutSchema(url, result);
        }
      } catch (e) {
        this.errorInfo = {
          status: 400,
          code: `Error loading from ${url}`
        };
      }
    }
    return result;
  }

  private async assignSchema(schema: ILayoutSchema) {
    let liveSchema = schema;
    if (liveSchema["datasource"]) {
      await this.loadData(liveSchema["datasource"]);
    }

    if (liveSchema["$children"]) {
      const data = this.getDataNode().getData();
      liveSchema = await this.genLiveLayout(schema, data);
    }

    if (liveSchema.children) {
      const children: any = [];
      for (let index in liveSchema.children) {
        let node: any;
        let s: any = liveSchema.children[index];
        if (_.isArray(s)) {
          node = [];
          for (let i in s) {
            const subnode = new UINode(s[i], this.request, this.rootName);
            await subnode.loadLayout(s[i]);
            node.push(subnode);
          }
        } else {
          node = new UINode(s, this.request, this.rootName);
          await node.loadLayout(s);
        }
        children.push(node);
      }
      this.children = children;
    }

    this.schema = liveSchema;
    // load State
    this.stateNode = new StateNode(this, this.loadDefaultPlugins);
    await this.stateNode.renewStates();

    // load ui.parser plugin
    try {
      await this.pluginManager.executePlugins("ui.parser");
    } catch (e) {
      console.log(e.message);
    }
    return this;
  }

  async loadData(source: string) {
    this.dataNode = new DataNode(source, this.request, this.loadDefaultPlugins);
    const result = await this.dataNode.loadData();
    return result;
  }

  async replaceLayout(newSchema: ILayoutSchema | string) {
    this.clearLayout();
    const schemaReplaced = await this.loadLayout(newSchema);
    return schemaReplaced;
  }

  async updateLayout() {
    const newSchema = await this.loadLayout(this.schema);
    return newSchema;
  }

  clearLayout() {
    this.schema = {};
    this.errorInfo = {};
    this.children = [];
    this.rootName = "";
    this.isLiveChildren = false;
    this.id = "";
    return this;
  }

  getNode(path?: string) {
    if (path) {
      return _.get(this, path);
    }
    return this;
  }

  getChildren(route?: Array<Number>) {
    if (_.isEmpty(this.children)) {
      console.warn(
        "did you execute loadLayout before using getChildren method?"
      );
    }
    if (route) {
      const path = route.map((v: Number) => {
        return `children[${v}]`;
      });
      return _.get(this, path.join("."));
    } else {
      return this.children;
    }
  }

  searchNodes(prop: object, root?: string): any {
    let nodes: Array<any> = [];

    const rootName = root || this.rootName;
    let allUINodes = Cache.getUINode(rootName) as IUINode;
    if (_.isObject(allUINodes)) {
      _.forIn(allUINodes, (target: any, id: string) => {
        let finded = true;
        const schema = target.getSchema();
        _.forIn(prop, (v: any, name: string) => {
          if (v !== schema[name]) {
            finded = false;
            return;
          }
        });
        if (finded) {
          nodes.push(target);
        }
      });
    }
    return nodes;
  }

  async genLiveLayout(schema: ILayoutSchema, data: any) {
    if (schema.datasource) {
      data = await this.loadData(schema.datasource);
    }

    // replace $ to row number
    const updatePropRow = (target: ILayoutSchema, index: string) => {
      if (_.isArray(target)) {
        _.forEach(target, (c: any) => {
          _.forIn(c, function(value, key) {
            if (typeof value === "object") {
              updatePropRow(value, index);
            } else if (_.isString(value) && value.indexOf("$") > -1) {
              _.set(c, key, value.replace("$", index));
            }
          });
        });
      } else {
        _.forIn(target, function(value, key) {
          if (typeof value === "object") {
            updatePropRow(value, index);
          } else if (_.isString(value) && value.indexOf("$") > -1) {
            _.set(target, key, value.replace("$", index));
          }
        });
      }
    };

    const liveSchema = schema;
    const rowTemplate: any = liveSchema.$children;
    if (rowTemplate && data) {
      liveSchema.children = data.map((d: any, index: string) =>
        rowTemplate.map((s: any) => {
          const newSchema = _.cloneDeep(s);
          if (newSchema.datasource) {
            updatePropRow(newSchema, index);
            newSchema._index = index; // row id
          }
          return newSchema;
        })
      );
    }

    // add a new children
    this.isLiveChildren = true;
    return liveSchema;
  }

  async updateState() {
    return await this.getStateNode().renewStates();
  }
}
