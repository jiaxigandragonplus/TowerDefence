import { Logger } from "../../framework/logger/Logger";
import { AsyncCallback } from "../../framework/utils/Utility";
//import { globalCfg } from "../cmn/data-define/global-cfg";
import { Splash } from "./Splash";

const log = new Logger("logic-main");

class LogicMain {
    // 初始化逻辑层
    init() {
        log.info("logic main initialized.");

        // 显示loading界面
        const SplashUI = new Splash();
        SplashUI.show((error) => {
            if (error) {
                //reject(error);
            }
            else {
                //resolve();
            }
        });
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