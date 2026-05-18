import { Logger } from "../../framework/logger/Logger";
import { LoginUIPrefab } from "../prefab_script/LoginUIPrefab";
import { UIBase } from "../../framework/ui/UIBase";
import { Utility } from "../../framework/utils/Utility";
import { AccountLogin } from "./AccountLogin";
import { MainUIPrefab } from "../prefab_script/MainUIPrefab";
import { ThemeChoose } from "./ThemeChoose";

const log = new Logger("MainScene");

export class MainScene extends UIBase {

    onShow() {
        const rs: MainUIPrefab = this.ccNode.getComponent(MainUIPrefab);
        rs.adventureBtn.node.on("click", this.onAdventureBtnClicked.bind(this));

        // 调整位置
        this.ccNode.x = 0;
        this.ccNode.y = 0;

        // 调整背景大小
        Utility.adaptUI(rs.bg);
    }

    onHide() {
        log.info("on main scene ui hide.");
    }

    onRelease() {
        log.info("on main scene released.");
    }

    getUrl(): string {
        return "prefab/main_ui";
    }

    onAdventureBtnClicked() {
        log.info("adventure clicked.");

        // 跳转到themeChoose界面
        this.showThemeChooseUI();
    }

    async showThemeChooseUI() {
        // 显示主题选择界面
        const themeChooseUI = new ThemeChoose();
        try {
            await themeChooseUI.show();
            log.info('theme choose ui show');
        } catch (error) {
            log.error(`show theme choose ui error: ${error}`);
        }
    }
}
