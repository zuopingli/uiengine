import _ from "lodash";
import {
  IWorkflow,
  IUINode,
  INodeController,
  ILoadOptions
} from "../../typings";

export default class Workflow implements IWorkflow {
  nodeController: INodeController;
  activeNode?: IUINode;

  constructor(nodeController: INodeController) {
    this.nodeController = nodeController;
  }

  async activeLayout(layout: string, options?: ILoadOptions) {
    let uiNode: IUINode;
    const uiNodeRenderer = this.nodeController.nodes[layout];
    if (uiNodeRenderer) {
      let node = this.nodeController.nodes[layout];
      uiNode = node.uiNode;
    } else {
      uiNode = await this.nodeController.loadUINode(layout, "", options);
    }

    this.activeNode = uiNode;
    return uiNode;
  }

  deactiveLayout() {}

  removeNodes(selector: object) {}

  refreshNodes(selector: object) {}

  assignPropsToNode(selector: object, props: any) {}

  updateData(source: string, data: any) {}

  updateState(source: string, state: any) {}
}