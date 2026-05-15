import { UIBase } from "../../../framework/ui/UIBase";
import { Logger } from "../../../framework/logger/Logger";
import { UIZIndex } from "../../../framework/ui/UIZIndex";
import { uiMgr } from "../../../framework/ui/UIMgr";
import { instantiate } from "cc";

const log = new Logger("ui-waiting");

class UIWaiting extends UIBase {
    isOpacityFullscreen(): boolean {
        return false;
    }

    isMutexWithNotBackable(): boolean {
        return false;
    }

    show(callback?: (error?: any) => void) {
        this.waitingCount++;
        this.hide();
        this.isHide = false;
        super.show(callback);
    }

    hide() {
        this.waitingCount--;
        if (this.waitingCount > 0) return;

        this.isHide = true;
        if (this.isLoaded())
            super.hide();
    }

    onShow() {
        if (this.isHide) {
            this.hide();
            return;
        }
    }

    onHide() {

    }

    onRelease() {

    }

    getUrl(): string {
        return "prefab/cmn/Win_Waiting";
    }

    protected doShow(callback?: (error?: any) => void) {
        if (this.ccNode == null) {
            this.ccNode = instantiate(this.prefab);
            const zIndex: UIZIndex = this.ccNode.getComponent(UIZIndex);
            if (zIndex) {
                this.layer = zIndex.layer;
                this.inLayerIdx = zIndex.localZIndex;
                this.ccNode.setSiblingIndex(zIndex.localZIndex);
            }
        }
        if (this.isHide) {
            return;
        }
        uiMgr.openUI(this);
        this.playOpenAnim();
        this.onShow();
        callback && callback();
    }

    private waitingCount: number = 0; // 当不为 0 的时候应该不被关闭。
    private isHide: boolean = false;
}

export const uiWaiting = new UIWaiting();
