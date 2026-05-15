import { GenericPool } from "../../../framework/pool/GenericPool";
import { UIBaseShowWaiting } from "./UIBaseShowWaiting";
import Win_CmnDlgBox from "./WinCmnDlgBox";
import { Node, Label } from "cc";

class UICmnDlgBoxMgr {
    async showCmnDlgBox(option: CmnDlgBoxOptions): Promise<void> {
        let prefab = this.defaultPrefab;
        if (option.prefab) {
            prefab = option.prefab;
        }
        if (this.dlgPoolMap[prefab] == null) {
            this.dlgPoolMap[prefab] = new GenericPool(UICmnDlgBox);
        }
        const dlgPool: GenericPool<UICmnDlgBox> = this.dlgPoolMap[prefab];
        const dlg = dlgPool.get();
        dlg.onHideCb = (dlg) => {
            dlgPool.put(dlg);
        };
        await dlg.showCmnDlgBox(option);
    }

    private readonly defaultPrefab: string = "defaultPrefab";
    private dlgPoolMap: { [prefab: string]: GenericPool<UICmnDlgBox> } = {};
}

class UICmnDlgBox extends UIBaseShowWaiting {
    isOpacityFullscreen(): boolean {
        return false;
    }

    async showCmnDlgBox(option: CmnDlgBoxOptions): Promise<void> {
        this.option = option;
        await this.show();
    }

    onShow() {
        this.uiRef = this.getNode().getComponent(Win_CmnDlgBox);
        this.setOptions();
        this.subscribeEvents();
    }

    onHide() {
        this.unsubscribeEvents();
        this.onHideCb && this.onHideCb(this);
    }

    onRelease() {
        this.unsubscribeEvents();
        this.onHideCb = undefined;
    }

    private setOptions() {
        this.uiRef.title.string = this.option.titleText || "";
        this.uiRef.content.string = this.option.contentText || "";
        if (this.option.firstBtn) {
            this.uiRef.firstBtn.node.active = true;
            const label = this.uiRef.firstBtn.node.getComponentInChildren(Label);
            if (label) {
                label.string = this.option.firstBtn.text || "";
            }
        }
        else {
            this.uiRef.firstBtn.node.active = false;
        }

        if (this.option.secondBtn) {
            this.uiRef.secondBtn.node.active = true;
            const label = this.uiRef.secondBtn.node.getComponentInChildren(Label);
            if (label) {
                label.string = this.option.secondBtn.text || "";
            }
        }
        else {
            this.uiRef.secondBtn.node.active = false;
        }

        if (this.option.thirdBtn) {
            this.uiRef.thirdBtn.node.active = true;
            const label = this.uiRef.thirdBtn.node.getComponentInChildren(Label);
            if (label) {
                label.string = this.option.thirdBtn.text || "";
            }
        }
        else {
            this.uiRef.thirdBtn.node.active = false;
        }
    }

    private subscribeEvents() {
        this.uiRef.closeBtn.node.on("click", this.onCloseBtnClicked, this);
        this.uiRef.firstBtn.node.on("click", this.onFirstBtnClicked, this);
        this.uiRef.secondBtn.node.on("click", this.onSecondBtnClicked, this);
        this.uiRef.thirdBtn.node.on("click", this.onThirdBtnClicked, this);
        this.uiRef.fullScreenBtn.on("click", this.onBgClicked, this);
    }

    private unsubscribeEvents() {
        this.uiRef.closeBtn.node.off("click", this.onCloseBtnClicked, this);
        this.uiRef.firstBtn.node.off("click", this.onFirstBtnClicked, this);
        this.uiRef.secondBtn.node.off("click", this.onSecondBtnClicked, this);
        this.uiRef.thirdBtn.node.off("click", this.onThirdBtnClicked, this);
        this.uiRef.fullScreenBtn.off("click", this.onBgClicked, this);
    }

    private onCloseBtnClicked() {
        this.hide();
        this.option.closeBtnCb && this.option.closeBtnCb();
    }

    private onFirstBtnClicked() {
        this.option.firstBtn && (this.option.firstBtn.notClose !== true) && this.hide();
        this.option.firstBtn && this.option.firstBtn.cb && this.option.firstBtn.cb();
    }

    private onSecondBtnClicked() {
        this.option.secondBtn && (this.option.secondBtn.notClose !== true) && this.hide();
        this.option.secondBtn && this.option.secondBtn.cb && this.option.secondBtn.cb();
    }

    private onThirdBtnClicked() {
        this.option.thirdBtn && (this.option.thirdBtn.notClose !== true) && this.hide();
        this.option.thirdBtn && this.option.thirdBtn.cb && this.option.thirdBtn.cb();
    }

    private onBgClicked() {
        this.option.bgTouch && this.option.bgTouch.close && this.hide();
        this.option.bgTouch && this.option.bgTouch.cb && this.option.bgTouch.cb();
    }

    getUrl(): string {
        if (this.option && this.option.prefab) {
            return this.option.prefab;
        }
        return "prefab/cmn/Win_CmnDlgBox";
    }

    getOption(): CmnDlgBoxOptions {
        return this.option;
    }

    //隐藏回调
    onHideCb: (dlg: UICmnDlgBox) => void;

    private uiRef: Win_CmnDlgBox;
    private option: CmnDlgBoxOptions;
}

export type DlgBtnCallback = () => void;

export type DlgBtnOption = {
    text: string;//按钮文本
    cb?: DlgBtnCallback;//按钮回调
    notClose?: boolean;//点击不关闭，默认点击关闭
};

export type CmnDlgBoxOptions = {
    titleText?: string;//标题
    contentText?: string;//内容
    firstBtn?: DlgBtnOption;//第一个按钮，置空则不显示此按钮
    secondBtn?: DlgBtnOption;//第二个按钮，置空则不显示此按钮
    thirdBtn?: DlgBtnOption;//第三个按钮，置空则不显示此按钮
    bgTouch?: {//背景，置空则不响应点击
        close: boolean;//触摸背景是否关闭
        cb?: DlgBtnCallback;//触摸背景回调
    };
    closeBtnCb?: DlgBtnCallback;//关闭按钮回调
    prefab?: string;//对话框的预制件路径，如果空则使用默认对话框
};

export const uiCmnDlgBoxMgr = new UICmnDlgBoxMgr();
