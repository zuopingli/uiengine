import _ from 'lodash'

import { NodeController } from '../data-layer'

import {
  IListener,
  IListenerConfig,
  IListenerHelper,
  IListenerParam,
  ISubmitProcess,
  ISubmitTarget,
  ISubmitOption,
  ISubmitCallback,
  IUINode,
} from '../../typings'

const listener: IListener = async (directParam: IListenerParam, helper: IListenerHelper) => {
  if (
    _.isObject(helper) &&
    _.isFunction(helper.getListenerRecords)
  ) {
    const prevRecords = helper.getListenerRecords()
    if (_.isArray(prevRecords) && prevRecords.length) {
      for(let i = 0; i < prevRecords.length; i++) {
        const record = prevRecords[i]
        if (_.isObject(record)) {
          const { listenerName, result } = record
          if (listenerName === 'submitData') {
            if (result instanceof Promise) {
              const prevStatus = await result
              if (prevStatus !== 'Submit Succeeded') {
                return prevStatus
              }
            } else {
              if (result !== 'Submit Succeeded') {
                return result
              }
            }
          }
        }
      }
    }
  }
  console.log('afterSubmit begin')

  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const target: ISubmitProcess | ISubmitTarget = _.get(directParam, 'target')
  const options: ISubmitOption = _.get(directParam, 'options')
  const callbacks: ISubmitCallback = _.get(directParam, 'callbacks')

  if (!_.isNil(uiNode) && _.isString(uiNode.layoutKey)) {
    const controller = NodeController.getInstance()
    const renderer = controller.layoutMap[uiNode.layoutKey]

    if (!_.isNil(renderer)) {
      const { options } = renderer

      if (_.isObject(options)) {
        const { container } = options
        if (container === 'antd:Drawer') {
          controller.removeLayout(uiNode.layoutKey, true)
        }
      }
    }
  }
}

export const afterSubmit: IListenerConfig = {
  name: 'afterSubmit',
  paramKeys: ['uiNode', 'target', 'options', 'callbacks'],
  debugList: [
    'uiNode.id',
    'uiNode.engineId',
    'uiNode.layoutKey',
    'target',
    'options',
  ],
  listener,
  weight: 0,
  describe: {
    target: {
      type: 'datatarget'
    },
    options: 'object',
    callbacks: 'object',
  }
}
