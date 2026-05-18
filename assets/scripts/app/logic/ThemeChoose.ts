import { Logger } from "../../framework/logger/Logger";
import { LoginUIPrefab } from "../prefab_script/LoginUIPrefab";
import { UIBase } from "../../framework/ui/UIBase";
import { Utility } from "../../framework/utils/Utility";
import { ThemeUIPrefab } from "../prefab_script/ThemeUIPrefab";

const log = new Logger("MainScene");

export class ThemeChoose extends UIBase {

    onShow() {
        const rs: ThemeUIPrefab = this.ccNode.getComponent(ThemeUIPrefab);
        rs.homeBtn.node.on("click", this.onHomeBtnClicked.bind(this));

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

    onHomeBtnClicked() {
        log.info("home clicked.");
    }
}
