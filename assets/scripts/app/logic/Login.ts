import { Logger } from "../../framework/logger/Logger";
import { LoginUIPrefab } from "../prefab_script/LoginUIPrefab";
import { UIBase } from "../../framework/ui/UIBase";
import { Utility } from "../../framework/utils/Utility";
import { AccountLogin } from "./AccountLogin";

const log = new Logger("test-coexist-ui");

export class Login extends UIBase {

    onShow() {
        const rs: LoginUIPrefab = this.ccNode.getComponent(LoginUIPrefab);
        rs.startBtn.node.on("click", this.onWeStartClicked.bind(this));

        // 调整位置
        this.ccNode.x = 0;
        this.ccNode.y = 0;

        // 调整背景大小
        Utility.adaptUI(rs.bg);
    }

    onHide() {
        log.info("on login ui hide.");
    }

    onRelease() {
        log.info("on login released.");
    }

    getUrl(): string {
        return "prefab/login_ui";
    }

    // 微信登录
    onWeStartClicked() {
        log.info("start clicked.");
    }
}
