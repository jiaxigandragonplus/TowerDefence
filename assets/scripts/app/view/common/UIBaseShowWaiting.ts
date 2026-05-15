import { uiWaiting } from "./UIWaiting";
import { UIBase } from "../../../framework/ui/UIBase";
import { Logger } from "../../../framework/logger/Logger";

const log = new Logger("ui-base-show-waiting");

export abstract class UIBaseShowWaiting extends UIBase {
    async show(): Promise<void> {
        const self = this;
        
        try {
            await uiWaiting.show();
            await self.superShow();
        } catch (err) {
            log.error(`show ui error: ${err}`);
            throw err;
        }
    }

    private async superShow(): Promise<void> {
        if (!this.isLoaded()) {
            await this.load();
        }
        //在界面打开前就关闭 waiting 界面
        uiWaiting.hide();
        this.doShow();
    }
}
