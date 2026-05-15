import { Logger } from "../../framework/logger/Logger";
import { SplashUIPrefab } from "../prefab_script/SplashUIPrefab";
import { UIBase } from "../../framework/ui/UIBase";
import { Login } from "./Login";
import { tween, Vec3, UIOpacity } from "cc";

const log = new Logger("test-coexist-ui");

export class Splash extends UIBase {

    onShow() {
        const rs: SplashUIPrefab = this.ccNode.getComponent(SplashUIPrefab);
        log.info("on Splash ui shown.");

        // 调整位置
        this.ccNode.x = 0;
        this.ccNode.y = 0;

        // 获取 UIOpacity 组件用于透明度动画
        let uiOpacity = rs.logo.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = rs.logo.addComponent(UIOpacity);
        }

        // 使用 Cocos Creator 3.x 的 tween 系统
        tween(uiOpacity)
            .to(0.5, { opacity: 255 })
            .delay(1)
            .to(0.5, { opacity: 0 })
            .call(() => {
                console.log('splash over');
                // 显示登录界面
                this.showLoginUI();
                // 关闭闪屏
                this.hide();
            })
            .start();

        // 同时处理位置移动
        tween(rs.logo)
            .to(0.5, { position: new Vec3(0, 0, 0) })
            .start();
    }

    async showLoginUI() {
        const LoginUI = new Login();
        try {
            await LoginUI.show();
            log.info('login ui show');
        } catch (error) {
            log.error(`show login ui error: ${error}`);
        }
    }

    onHide() {
        log.info("on splash ui hid.");
    }

    onRelease() {
        log.info("on splash released.");
    }

    getUrl(): string {
        return "prefab/splash-ui";
    }
}
