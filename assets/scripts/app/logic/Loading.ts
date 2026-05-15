import { Logger } from "../../framework/logger/Logger";
import { LoadingUIPrefab } from "../prefab_script/LoadingUIPrefab";
import { UIBase } from "../../framework/ui/UIBase";
import { Utility } from "../../framework/utils/Utility";
const log = new Logger("test-coexist-ui");

export class Loading extends UIBase {

    onShow() {
        const rs: LoadingUIPrefab = this.ccNode.getComponent(LoadingUIPrefab);
        //rs.hideButton.node.on("click", this.OnHideBtnClicked.bind(this));
        //rs.releaseButton.node.on("click", this.OnReleaseBtnClicked.bind(this));
        log.info("on Loading ui shown.");

        // 调整位置
        this.ccNode.x = 0;
        this.ccNode.y = 0;

        // 调整背景大小
        Utility.adaptUI(rs.bg);

        rs.setLoadingProgress(0.5);
    }

    onHide() {
        log.info("on Loading ui hid.");
    }

    onRelease() {
        log.info("on Loading released.");
    }

    getUrl(): string {
        return "prefab/loading_ui";
    }
}
