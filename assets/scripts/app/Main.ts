import { _decorator, Component, Node, sys, game } from "cc";
import { Logger } from "../framework/logger/Logger";
import { LangSetting } from "../framework/i18n/MultiLanguage";
import { uiMgr } from "../framework/ui/UIMgr";
import { viewMain } from "./view/ViewMain";
import { logicMain } from "./logic/LogicMain";

const log = new Logger("main");
const { ccclass, property, menu } = _decorator;

@ccclass
@menu("ig/Main")
export default class Main extends Component {
    // UI根结点，此结点为persist node，跨场景存活，这意味着所有打开的UI需要手动release
    @property(Node)
    uiRoot: Node = null;
    // 是否启用调试控制台
    @property
    enableDebugConsole: boolean = false;
    // 切换场景不删除的结点
    @property([Node])
    persistNodes: Node[] = [];

    onLoad() {
        Main.instance = this;
        this.initDebugConsole();
        this.bindOnClose();
        this.bindOnRestart();
        LangSetting.init();
    }

    start() {
        uiMgr.init(this.uiRoot);
        viewMain.init();
        logicMain.init();
    }

    bindOnClose(): void {
        if (window != null && typeof window.addEventListener == "function") {
            window.addEventListener("beforeunload", function () {
                log.info("on game close.");
                viewMain.shut();
                logicMain.shut();
            });
        }
    }

    initDebugConsole() {
        let debugConsoleFlag = sys.localStorage.getItem("DebugConsole");
        if (debugConsoleFlag == null) {
            debugConsoleFlag = "false";
            sys.localStorage.setItem("DebugConsole", debugConsoleFlag);
        }
        this.enableDebugConsole = this.enableDebugConsole || /^true$/i.test(debugConsoleFlag);
        if (!this.enableDebugConsole) {
            return;
        }
    }

    onCmd(cmd: string) {
        log.info("in-game-console-cmd: ", cmd);
    }

    private bindOnRestart() {
        const originalRestart = game.restart;
        if (!originalRestart) {
            log.warn("game.restart is null.");
            return;
        }
        // 包装重启函数，在引擎重启前先调用表现层和逻辑层的重启回调
        game.restart = async () => {
            return new Promise<void>((resolve) => {
                viewMain.restart(() => {
                    logicMain.restart(() => {
                        originalRestart().then(() => {
                            resolve();
                        });
                    });
                });
            });
        };
    }

    static schedule(callback: Function, interval?: number, repeat?: number, delay?: number) {
        Main.instance.schedule(callback, interval, repeat, delay);
    }

    static scheduleOnce(callback: Function, delay?: number) {
        Main.instance.scheduleOnce(callback, delay);
    }

    private static instance: Main;
}
