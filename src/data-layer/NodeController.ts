import _ from "lodash";

import {
  IUINode,
  IMessager,
  INodeController,
  INodeProps,
  ILayoutSchema,
  IRequestConfig,
  IErrorInfo,
  IWorkflow,
  IUINodeRenderer,
  IRequest,
  ILoadOptions
} from "../../typings";
import { UINode } from "../data-layer";
import { Messager, Request, Workflow } from "../helpers";
import { searchNodes } from "../helpers";

export default class NodeController implements INodeController {
  static instance: INodeController;
  static getInstance = () => {
    if (!NodeController.instance) {
      NodeController.instance = new NodeController();
    }
    return NodeController.instance as NodeController;
  };

  // layout path
  errorInfo: IErrorInfo = {};
  // layouts: object = {};
  nodes: {
    [name: string]: IUINodeRenderer;
  } = {};
  messager: IMessager = Messager.getInstance();
  requestConfig: IRequestConfig = {};
  activeLayout: string = "";
  layouts: Array<string> = [];
  workflow: IWorkflow;
  engineId: string = _.uniqueId("engine-");
  request: IRequest = Request.getInstance();

  constructor() {
    this.workflow = new Workflow(this);
  }

  setRequestConfig(requestConfig: IRequestConfig) {
    this.requestConfig = requestConfig;
    this.request.setConfig(this.requestConfig);
  }

  /**
   * Load a layout from remote or local
   * @param layout ILayoutSchema|string path of layout or loaded layout
   */
  loadUINode(
    layout: ILayoutSchema | string,
    id?: string,
    options?: ILoadOptions
  ) {
    // get a unique id
    let rootName = "default";
    if (id) {
      rootName = id;
    } else {
      if (_.isObject(layout)) {
        rootName = _.get(layout, "id", "default");
      } else {
        rootName = layout;
      }
    }

    // use cached nodes
    let uiNodeRenderer = this.nodes[rootName];
    let uiNode: IUINode;
    if (!uiNodeRenderer) {
      // default we load all default plugins
      uiNode = new UINode({}, this.request, rootName);
      try {
        uiNode.loadLayout(layout).then(() => {
          this.nodes[rootName] = { uiNode, visible: true, options };
          // add layout stack
          this.pushLayout(rootName);
          this.activeLayout = rootName;
          this.messager.sendMessage(this.engineId, {
            nodes: this.nodes
          });
        });
      } catch (e) {
        console.error(e.message);
      }
    } else {
      uiNode = uiNodeRenderer.uiNode;
      this.nodes[rootName] = { uiNode, visible: true, options };
      this.messager.sendMessage(this.engineId, {
        nodes: this.nodes
      });
    }

    return uiNode;
  }

  deleteUINode(layout: string): boolean {
    _.unset(this.nodes, layout);

    // send message to caller
    this.messager.sendMessage(this.engineId, this.nodes);
    _.remove(this.layouts, (l: string) => {
      return l === layout;
    });

    // activelayout
    this.activeLayout = _.last(this.layouts) || "";
    return true;
  }

  hideUINode(layout: string) {
    const renderer = this.nodes[layout];
    if (renderer) {
      renderer.visible = false;
    }

    this.messager.sendMessage(this.engineId, {
      nodes: this.nodes
    });
  }

  getUINode(layout: string, uiNodeOnly: boolean = false) {
    const uiNode = _.get(this.nodes, layout);
    if (uiNodeOnly) {
      return uiNode.uiNode;
    }
    return uiNode;
  }

  castMessage(nodeSelector: INodeProps, data: any, ids?: [string]) {
    let nodes: any = this.nodes;
    if (ids) {
      nodes = _.pick(this.nodes, ids);
    }
    _.forIn(nodes, (uiNode: IUINodeRenderer) => {
      let searchedNodes = searchNodes(nodeSelector, uiNode.uiNode.rootName);
      _.forEach(searchedNodes, (s: IUINode) => {
        s.messager.sendMessage(s.id, data);
      });
    });
  }

  pushLayout(layout: string) {
    _.remove(this.layouts, (l: string) => {
      return l === layout;
    });

    this.layouts.push(layout);
  }
}
