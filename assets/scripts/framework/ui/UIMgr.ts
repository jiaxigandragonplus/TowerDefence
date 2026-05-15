import { Node, UITransform } from "cc";
import { UIBase } from "./UIBase";
import { Utility } from "../utils/Utility";
import { Logger } from "../logger/Logger";
import PlayAudio from "../audio/PlayAudio";

const log = new Logger("ui-mgr");

class UIMgr {
    init(root: Node): boolean {
        this.uiRoot = root;
        if (root == null) {
            return false;
        }
        return true;
    }

    async shut(): Promise<void> {
        while (this.uiList.length > 0) {
            await this.uiList[0].release();
        }
    }

    restart() {
        this.closeAllUI();
        this.uiInMemory.forEach(ui => {
            ui.restart();
        });
        this.uiInMemory = [];
    }

    openUI(ui: UIBase) {
        if (ui.isMutexWithNotBackable()) {
            this.closeNotBackableUI();
        }
        this.attachToUIRoot(ui);
        this.addToUIList(ui);
        if (ui.isOpacityFullscreen()) {
            this.hideBelowUI(ui);
        }
    }

    closeUI(ui: UIBase) {
        if (ui.isOpacityFullscreen()) {
            this.restoreLowerUI(ui);
        }
        Utility.removeFromArray(this.uiList, ui);
        this.removeFromUIRoot(ui);
    }

    closeAllUI() {
        for (let i = 0; i < this.uiList.length; ++i) {
            const uiToClose = this.uiList[i];
            uiToClose.onHide();
            this.removeFromUIRoot(uiToClose);
        }
        this.uiList = [];
    }

    getRoot(): Node {
        return this.uiRoot;
    }

    get screenWidth() {
        // Cocos Creator 3.x 中使用 UITransform 获取尺寸
        const uiTransform = this.uiRoot.getComponent(UITransform);
        return uiTransform ? uiTransform.contentSize.width : 0;
    }

    get screenHeight() {
        // Cocos Creator 3.x 中使用 UITransform 获取尺寸
        const uiTransform = this.uiRoot.getComponent(UITransform);
        return uiTransform ? uiTransform.contentSize.height : 0;
    }

    addToUIInMemory(ui: UIBase) {
        if (this.uiInMemory.indexOf(ui) >= 0) {
            return;
        }
        this.uiInMemory.push(ui);
    }

    delFromUIInMemory(ui: UIBase) {
        Utility.removeFromArray(this.uiInMemory, ui);
    }

    private addToUIList(ui: UIBase) {
        if (this.uiList.indexOf(ui) >= 0) {
            log.warn(`add ui to list multi times is not allowed, ui.getUrl() = ${ui.getUrl()}`);
            return;
        }
        let inserted = false;
        for (let i = 0; i < this.uiList.length; ++i) {
            const tmpUI = this.uiList[i];
            if (this.isAUpperThanB(tmpUI, ui)) {
                Utility.insertToArray(this.uiList, i, ui);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this.uiList.push(ui);
        }
    }

    private hideBelowUI(ui: UIBase) {
        const index = this.uiList.indexOf(ui);
        if (index == null || index <= 0) {
            return;
        }
        for (let i = 0; i < index; ++i) {
            const uiToHide = this.uiList[i];
            if (uiToHide.getNode().active === false) {
                continue;
            }
            uiToHide.getNode().active = false;
            uiToHide.onHide();
        }
    }

    private restoreLowerUI(ui: UIBase) {
        const index = this.uiList.indexOf(ui);
        if (index == null || index <= 0) {
            return;
        }
        for (let i = index - 1; i >= 0; --i) {
            const uiToRestore = this.uiList[i];

            const audioComp = uiToRestore.getNode().getComponent(PlayAudio);
            if (audioComp) {
                audioComp.disableAutoPlayInEnable();
            }

            uiToRestore.getNode().active = true;
            uiToRestore.onShow();

            if (audioComp) {
                audioComp.restoreAutoPlayInEnable();
            }
            if (uiToRestore.isOpacityFullscreen()) {
                break;
            }
        }
    }

    private closeNotBackableUI() {
        const tmp: UIBase[] = [];
        for (let i = this.uiList.length - 1; i >= 0; --i) {
            const ui = this.uiList[i];
            if (!ui.isBackable()) {
                tmp.push(ui);
            }
        }
        for (let i = 0; i < tmp.length; ++i) {
            const uiToClose = tmp[i];
            Utility.removeFromArray(this.uiList, uiToClose);
            uiToClose.onHide();
            this.removeFromUIRoot(uiToClose);
        }
    }

    //界面 a 是否在界面 b 之上
    private isAUpperThanB(a: UIBase, b: UIBase) {
        if (a.getLayer() > b.getLayer() ||
            (a.getLayer() == b.getLayer() && a.getInLayerIdx() > b.getInLayerIdx())
        ) {
            return true;
        }
        return false;
    }

    private attachToUIRoot(ui: UIBase) {
        if (this.uiRoot == null || ui == null) {
            return;
        }
        const parentName = ui.getExpectedParentName();
        let layerNode = this.uiRoot.getChildByName(parentName);
        if (layerNode == null) {
            layerNode = new Node(parentName);
            // Cocos Creator 3.x 中使用 UITransform 设置尺寸
            const uiTransform = this.uiRoot.getComponent(UITransform);
            if (uiTransform) {
                const layerTransform = layerNode.getComponent(UITransform) || layerNode.addComponent(UITransform);
                layerTransform.setContentSize(uiTransform.contentSize);
            }
            this.uiRoot.addChild(layerNode);
            layerNode.setSiblingIndex(ui.getLayer());
        }
        ui.getNode().setParent(layerNode);
        ui.getNode().active = true;
    }

    private removeFromUIRoot(ui: UIBase) {
        // Cocos Creator 3.x 中 removeFromParent 不需要参数
        ui.getNode().removeFromParent();
    }

    private uiRoot: Node;           // 所有由代码打开的界面的根结点
    private uiList: UIBase[] = [];  // 所有打开的未显式关闭的界面列表，根据界面层级排序
    private uiInMemory: UIBase[] = [];// 所有打开的未释放的界面列表
}

export const uiMgr = new UIMgr();
