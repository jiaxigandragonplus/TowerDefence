import { Logger } from "../../framework/logger/Logger";
import { LoginUIPrefab } from "../prefab_script/LoginUIPrefab";
import { UIBase } from "../../framework/ui/UIBase";
import { Utility } from "../../framework/utils/Utility";
import { ThemeUIPrefab } from "../prefab_script/ThemeUIPrefab";
import { StageUIPrefab } from "../prefab_script/StageUIPrefab";

const log = new Logger("StageChoose");

export class StageChoose extends UIBase {

    onShow() {
        const rs: StageUIPrefab = this.ccNode.getComponent(StageUIPrefab);
        rs.backBtn.node.on("click", this.onBackBtnClicked.bind(this));

        // 调整位置
        this.ccNode.x = 0;
        this.ccNode.y = 0;

        // 调整背景大小
        Utility.adaptUI(rs.bg);
    }

    onHide() {
        log.info("on theme choose ui hide.");
    }

    onRelease() {
        log.info("on theme choose released.");
    }

    getUrl(): string {
        return "prefab/theme_ui";
    }

    onBackBtnClicked() {
        log.info("home clicked.");
    }
}
