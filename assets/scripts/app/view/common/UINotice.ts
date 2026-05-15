import { GenericPool } from "../../../framework/pool/GenericPool";
import Win_Notice from "./WinNotice";
import { Translator } from "../../../framework/i18n/MultiLanguage";
import { UIBase } from "../../../framework/ui/UIBase";
import { resLoadHelper, ResType } from "./ResLoadHelper";
import { AsyncCallback } from "../../../framework/utils/Utility";
import { Logger } from "../../../framework/logger/Logger";
import { Sprite, Color } from "cc";

const log = new Logger("ui-notice");

class UINoticeMgr {
    init(callback: AsyncCallback) {
        const self = this;
        // 使用 Promise 替代 async.waterfall
        new Promise<void>((resolve, reject) => {
            // 假设 globalCfg 已被移除或需要重新实现
            resolve();
        })
        .then(() => {
            self.noticeShowing = false;
            self.noticeQueue = [];
            self.isPause = false;
            self.timerId = 0;
            callback();
        })
        .catch((err: Error) => {
            callback(err);
        });
    }

    //显示小尺寸的提示信息，传入文本
    showNoticeS(text: string, iconFilePath?: string, fontColor?: boolean) {
        const data: NoticeInfo = {
            type: NoticeType.SmallNotice,
            textData: text,
            iconFilePath: iconFilePath,
            fontColor: fontColor
        }
        this.noticeQueue.push(data);
        this.checkAndShowNotice();
    }
    //显示小尺寸的提示信息，传入多语言键值
    showNoticeSI18n(contentKey: string, iconFilePath?: string) {
        this.showNoticeS(Translator.t(contentKey), iconFilePath);
    }

    //显示大尺寸的提示信息，传入文本
    showNoticeL(text: string, iconFilePath?: string) {
        const data: NoticeInfo = {
            type: NoticeType.LargeNotice,
            textData: text,
            iconFilePath: iconFilePath
        }
        this.noticeQueue.push(data);
        this.checkAndShowNotice();
    }
    //显示大尺寸的提示信息，传入多语言键值
    showNoticeLI18n(contentKey: string, iconFilePath?: string) {
        this.showNoticeL(Translator.t(contentKey), iconFilePath);
    }

    //显示国力提升提示，传入数值
    showPowerUp(oldPower: number, newPower: number) {
        const data: NoticeInfo = {
            type: NoticeType.PowerUpNotice,
            textData: { oldPower: oldPower, newPower: newPower },
            iconFilePath: null,
            alwaysShowIcon: true
        }
        this.noticeQueue.push(data);
        this.checkAndShowNotice();
    }

    pause() {
        clearTimeout(this.timerId);
        this.isPause = true;
        this.noticeShowing = false;
    }

    play() {
        this.isPause = false;
        this.checkAndShowNotice();
    }

    setInterval(seconds: number) {
        this.intervals = seconds;
    }

    private checkAndShowNotice() {
        if (this.noticeQueue.length <= 0 || this.noticeShowing || this.isPause) {
            return;
        }

        const noticeInfo = this.noticeQueue.shift();
        if (noticeInfo) {
            this.noticeShowing = true;
            this.ParseAndShowNoticeInfo(noticeInfo);
            this.timerId = setTimeout(() => {
                this.noticeShowing = false;
                this.checkAndShowNotice();
            }, this.intervals * 1000);
        }
    }

    private ParseAndShowNoticeInfo(info: NoticeInfo) {
        switch (info.type) {
            case NoticeType.LargeNotice:
                const noticeL = this.noticeLargePool.get();
                noticeL.onFinished(() => {
                    this.noticeLargePool.put(noticeL);
                });
                noticeL.showNotice(info.textData, info.iconFilePath, info.alwaysShowIcon);
                break;
            case NoticeType.SmallNotice:
                const noticeS = this.noticeSmallPool.get();
                noticeS.onFinished(() => {
                    this.noticeSmallPool.put(noticeS);
                });
                noticeS.showNotice(info.textData, info.iconFilePath, info.alwaysShowIcon, info.fontColor);
                break;
            case NoticeType.PowerUpNotice:
                const noticePowerUp = this.noticePowerUpPool.get();
                noticePowerUp.onFinished(() => {
                    this.noticePowerUpPool.put(noticePowerUp);
                });
                noticePowerUp.showNotice(info.textData, info.iconFilePath, info.alwaysShowIcon);
                break;
            default:
                log.error("UINoticeMgr.ParseAndShowNoticeInfo ERROR: cant parse notice type.");
        }
    }

    private noticeSmallPool: GenericPool<UINoticeSmall> = new GenericPool(UINoticeSmall);
    private noticeLargePool: GenericPool<UINoticeLarge> = new GenericPool(UINoticeLarge);
    private noticePowerUpPool: GenericPool<UINoticePowerUp> = new GenericPool(UINoticePowerUp);
    private noticeQueue: NoticeInfo[] = [];
    private noticeShowing: boolean = false;
    private intervals: number = 0.5;
    private isPause: boolean;
    private timerId: any;
}

enum NoticeType {
    SmallNotice,
    LargeNotice,
    PowerUpNotice
}

type NoticeInfo = {
    type: NoticeType,
    textData: any,
    iconFilePath?: string,
    alwaysShowIcon?: boolean
    fontColor?: boolean;
}

type PowerUpTextData = {
    oldPower: number,
    newPower: number
}

abstract class UINotice extends UIBase {
    async showNotice(textData: any, iconFilePath?: string, alwaysShowIcon?: boolean, fontColor?: boolean): Promise<void> {
        this.textData = textData;
        this.iconFilePath = iconFilePath;
        this.alwaysShowIcon = !!alwaysShowIcon;
        this.fontColor = fontColor;
        await this.show();
    }

    onFinished(cb: FinishedCb) {
        this.finishedCb = cb;
    }

    isOpacityFullscreen() {
        return false;
    }

    isBackable(): boolean {
        return false;
    }

    isMutexWithNotBackable(): boolean {
        return false;
    }

    onShow() {
        this.uiRef = this.getNode().getComponent(Win_Notice);
        if (this.uiRef.icon) {
            if (this.iconFilePath == null) {
                this.uiRef.icon.node.active = false || this.alwaysShowIcon;
            }
            else {
                this.uiRef.icon.node.active = false;
                resLoadHelper.setSprite(ResType.None, this.uiRef.icon, this.iconFilePath, false, err => {
                    this.uiRef.icon.node.active = true;
                });
            }
        }

        this.setLabel(this.textData);

        if (this.fontColor == true) {
            this.uiRef.label.color = Color.GREEN;
        } else {
            this.uiRef.label.color = new Color(255, 255, 255);
        }
        this.uiRef.animation.play();
        const state = this.uiRef.animation.getState(this.uiRef.animation.defaultClip.name);
        if (state) {
            state.on("finished", () => {
                this.hide();
                this.finishedCb && this.finishedCb(this);
                this.finishedCb = null;
            });
        }
    }

    onHide() {
        this.uiRef.animation.stop();
    }

    onRelease() {
        this.uiRef.animation.stop();
    }

    protected abstract setLabel(textData: any);
    protected uiRef: Win_Notice;
    protected iconFilePath: string;
    protected alwaysShowIcon: boolean;
    protected textData: any;
    protected finishedCb: FinishedCb;
    protected fontColor: boolean;
}

class UINoticeSmall extends UINotice {
    async showNotice(text: string, iconFilePath?: string, alwaysShowIcon?: boolean, fontColor?: boolean): Promise<void> {
        await super.showNotice(text, iconFilePath, alwaysShowIcon, fontColor);
    }

    getUrl(): string {
        return "prefab/cmn/Win_NoticeSmall";
    }

    protected setLabel(textData: string) {
        this.uiRef.label.string = textData;
    }
}

class UINoticeLarge extends UINotice {
    async showNotice(text: string, iconFilePath?: string, alwaysShowIcon?: boolean, fontColor?: boolean): Promise<void> {
        await super.showNotice(text, iconFilePath, alwaysShowIcon, fontColor);
    }

    getUrl(): string {
        return "prefab/cmn/Win_NoticeLarge";
    }

    protected setLabel(textData: string) {
        this.uiRef.label.string = textData;
    }
}

class UINoticePowerUp extends UINotice {
    async showNotice(text: PowerUpTextData, iconFilePath?: string, alwaysShowIcon?: boolean, fontColor?: boolean): Promise<void> {
        await super.showNotice(text, iconFilePath, alwaysShowIcon, fontColor);
    }

    getUrl(): string {
        return "prefab/cmn/Win_NoticePowerUp";
    }

    protected setLabel(textData: PowerUpTextData) {
        this.uiRef.setNumLabelWithAnim(textData.oldPower, textData.newPower, 2);
    }
}

type FinishedCb = (notice: UINotice) => void;

export enum SpecialNoticeType {
    DontShow = 1,
}

export const uiNotice = new UINoticeMgr();
