import { Logger } from "../../framework/logger/Logger";
import { AccountLoginUIPrefab } from "../prefab_script/AccountLoginUIPrefab";
import { UIBase } from "../../framework/ui/UIBase";
import { Utility } from "../../framework/utils/Utility";
const log = new Logger("test-coexist-ui");

export class AccountLogin extends UIBase {

    onShow() {
        const rs: AccountLoginUIPrefab = this.ccNode.getComponent(AccountLoginUIPrefab);
        rs.closeBtn.node.on("click", this.onCloseClicked.bind(this));
        rs.loginBtn.node.on("click", this.onLoginClicked.bind(this));

        // 调整位置
        this.ccNode.x = 0;
        this.ccNode.y = 0;

        // 调整背景大小
        Utility.adaptUI(rs.clickMask);
        log.info('show account login');
    }

    onHide() {
        log.info("on Loading ui hid.");
    }

    onRelease() {
        log.info("on Loading released.");
    }

    getUrl(): string {
        return "prefab/account-login-ui";
    }

    // 关闭界面
    async onCloseClicked() {
        log.info("close account login.");
        await this.hide();
    }

    // 登录
    onLoginClicked() {
        log.info("account login.");
    }
}
