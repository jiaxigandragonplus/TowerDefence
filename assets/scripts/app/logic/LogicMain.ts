import { Logger } from "../../framework/logger/Logger";
import { AsyncCallback } from "../../framework/utils/Utility";
//import { globalCfg } from "../cmn/data-define/global-cfg";
import { Splash } from "./Splash";

const log = new Logger("logic-main");

class LogicMain {
    // 初始化逻辑层
    async init() {
        log.info("logic main initialized.");

        // 显示 loading 界面
        const SplashUI = new Splash();
        try {
            await SplashUI.show();
        } catch (error) {
            log.error(`show splash error: ${error}`);
        }
    }

    // 逻辑层退出
    shut() {
        log.info("logic main shutdown.");
    }

    //重启
    restart(callback: AsyncCallback) {
        //globalCfg.restart();
        callback();
    }
}

export const logicMain = new LogicMain();
