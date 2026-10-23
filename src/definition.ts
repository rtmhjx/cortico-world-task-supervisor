import type { WorldDefinition } from 'cortico/world.ts';
import { taskSupervisorDefaults, type TaskSupervisorConfig } from './config.ts';
import { TaskSupervisorWorld, qqSendTool,statusTool } from './world.ts';
import { catalogTools } from './catalog.ts';

export const TASK_SUPERVISOR:WorldDefinition<TaskSupervisorConfig>={
  id:'tasksupervisor',label:'Task Supervisor',defaults:taskSupervisorDefaults,
  create:context=>new TaskSupervisorWorld({context}),
  describe:{tools:[statusTool,qqSendTool,...catalogTools()].map(({handler:_handler,...tool})=>tool),
    events:[
      {type:'tasksupervisor.mode',description:{zh:'真实本人私聊切换了监管开关。',en:'A real owner private message changed supervision mode.'},trigger:'flush'},
      {type:'conversationcontrol.mode',description:{zh:'已保存的监管模式切换回执。',en:'A committed remote supervision mode transition.'},trigger:'flush'},
      {type:'conversationcontrol.result',description:{zh:'原生任务完成或需人处理的回执。',en:'Native task completion or a human-action receipt.'},trigger:'flush'},
      {type:'conversationcontrol.progress',description:{zh:'DSH原生任务完成或需人处理的问题。',en:'A DSH native completion or human-action boundary.'},trigger:'flush'},
      {type:'codexbridge.update',description:{zh:'Codex原生任务结束或需人处理的问题。',en:'A Codex native terminal or human-action boundary.'},trigger:'flush'},
      {type:'qq.message',description:{zh:'原生本人私聊消息；#@切换开关，ON时接收后续聊天，每个平台消息只投递一次。',en:'A canonical owner private QQ message, delivered once per platform ID; #@ changes mode and ordinary chat is accepted while ON.'},trigger:'flush'},
    ]},
};
