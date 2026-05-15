import { uiWaiting } from "./UIWaiting";
import { UIBase } from "../../../framework/ui/UIBase";
import { Logger } from "../../../framework/logger/Logger";

const log = new Logger("ui-base-show-waiting");

export abstract class UIBaseShowWaiting extends UIBase {
    show(callback?: (error?: any) => void) {
        const self = this;
        
        // 使用 Promise 替代 async.waterfall
        new Promise((resolve, reject) => {
            uiWaiting.show((err) => {
                if (err) reject(err);
                else resolve(null);
            });
        })
        .then(() => {
            return new Promise<void>((resolve, reject) => {
                self.superShow((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        })
        .then(() => {
            callback && callback();
        })
        .catch((err) => {
            callback && callback(err);
        });
    }

    private superShow(callback?: (error?: any) => void) {
        if (!this.isLoaded()) {
            this.load((error) => {
                uiWaiting.hide();
                if (error) {
                    log.error(`loading ui ${this.getUrl()} error, ${error}`);
                    callback && callback(error);
                    return;
                }
                this.doShow(callback);
            });
            return;
        }
        //在界面打开前就关闭 waiting 界面
        uiWaiting.hide();
        this.doShow(callback);
    }
}
