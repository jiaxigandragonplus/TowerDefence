import { Logger } from "../../framework/logger/Logger";
import { LoginUIPrefab } from "../prefab_script/LoginUIPrefab";
import { UIBase } from "../../framework/ui/UIBase";
import { Utility } from "../../framework/utils/Utility";
import { AccountLogin } from "./AccountLogin";

const log = new Logger("test-coexist-ui");

export class Login extends UIBase {

    onShow() {
        const rs: LoginUIPrefab = this.ccNode.getComponent(LoginUIPrefab);
        rs.wechatLoginBtn.node.on("click", this.onWeChatLoginClicked.bind(this));
        rs.accountLoginBtn.node.on("click", this.onAccountLoginClicked.bind(this));
        rs.accountRegBtn.node.on("click", this.onAccountRegClicked.bind(this));
        rs.guestLoginBtn.node.on("click", this.onGuestLoginClicked.bind(this));
        rs.customBtn.node.on("click", this.onCustomClicked.bind(this));

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
        return "prefab/login-ui";
    }

    // 微信登录
    onWeChatLoginClicked() {
        log.info("wechat login.");
    }

    // 账号登录
    onAccountLoginClicked() {
        log.info("call onAccountLoginClicked.");
        const loginUI = new AccountLogin();
        loginUI.show((error) => {
            log.info('show account login');
        })
    }

    // 账号注册
    onAccountRegClicked() {
        log.info("account register.");
    }

    // 客服
    onCustomClicked() {
        log.info("customer click.");
    }

    // 游客登录
    onGuestLoginClicked() {
        log.info("guest login.");
    }
}
