import { launchStage } from "./launch/LaunchStage";
import { Logger } from "../../framework/logger/Logger";
import { EventEmitter } from "../../framework/event/EventEmitter";
import { AsyncCallback } from "../../framework/utils/Utility";
import { uiMgr } from "../../framework/ui/UIMgr";
const log = new Logger("viewMain");

class ViewMain {
    // 初始化表现层
    init() {
        log.info("view main initialized.");
        launchStage.enter();
    }
    // 表现层退出
    async shut(): Promise<void> {
        log.info("view main shutdown.");
        await uiMgr.shut();
    }
    //重启
    async restart(callback: AsyncCallback): Promise<void> {
        uiMgr.restart();
        callback();
    }
    // 表现层的全局事件发射器
    // 目前已有事件列表：
    // BeforeSceneUnload，场景御载前
    // AfterSceneLoaded，场景加载完成后
    events: EventEmitter = new EventEmitter();
}

export const viewMain = new ViewMain();