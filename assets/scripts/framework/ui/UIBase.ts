import { Logger } from "../logger/Logger";
import { UIZIndex } from "./UIZIndex";
import { uiMgr } from "./UIMgr";
import { Prefab, Node, Animation, resources, instantiate, sys } from "cc";

const log = new Logger("ui-base");

// 所有 UI 的基类
export abstract class UIBase {
    // 显示当前界面，如果未加载则先加载
    show(callback?: (error?: any) => void) {
        uiMgr.addToUIInMemory(this);
        if (!this.isLoaded()) {
            this.load((error) => {
                if (error) {
                    log.error(`loading ui ${this.getUrl()} error, ${error}`);
                    callback && callback(error);
                    return;
                }
                this.doShow(callback);
            });
            return;
        }
        this.doShow(callback);
    }

    // 隐藏当前界面
    hide() {
        if (!this.ccNode.activeInHierarchy) {
            return;
        }
        this.playCloseAnim(() => {
            this.onHide();
            uiMgr.closeUI(this);
            this.onHideOver();
        });
    }

    // 释放当前界面，会清理内存
    release() {
        const doRelease = () => {
            this.onRelease();
            uiMgr.closeUI(this);
            if (this.ccNode != null) {
                this.ccNode.destroy();
                this.ccNode = undefined;
            }
            this.prefab = undefined;
            this.layer = 0;
            this.inLayerIdx = 0;
            this.unload();
            this.onReleaseOver();
            uiMgr.delFromUIInMemory(this);
        };
        if (this.ccNode.activeInHierarchy) {
            this.playCloseAnim(() => {
                doRelease();
            });
        }
        else {
            doRelease();
        }
    }

    //重启
    restart() {
        this.ccNode = undefined;
        this.prefab = undefined;
        this.layer = 0;
        this.inLayerIdx = 0;
        this.onRestart();
    }

    // 是否已经加载完成
    isLoaded() {
        return this.prefab != null;
    }

    // 期望添加到的父类结点名称
    getExpectedParentName() {
        return "uiLayer_" + this.layer;
    }

    getLayer(): number {
        return this.layer;
    }

    getInLayerIdx(): number {
        return this.inLayerIdx;
    }

    // 获取引擎结点
    getNode() {
        return this.ccNode;
    }

    // 是否不透明全屏界面，最后打开的不透明全屏界面会自动隐藏在当前界面层级之下的界面，退出后恢复打开前的状态
    isOpacityFullscreen(): boolean {
        return true;
    }

    // 是否可返回，不可返回的界面在任意其它界面打开的时候会被自动关闭
    isBackable(): boolean {
        return true;
    }

    // 是否与不可返回界面互斥，默认是互斥的，打开一个界面会自动关闭不可返回界面
    isMutexWithNotBackable(): boolean {
        return true;
    }

    // 正在加载界面的回调，仅当 callback 被调用才会真正结束加载，
    // 这个方法为子类提供与界面加载时并行执行异步担任的可能
    onLoading(callback: (err?: Error) => void) {
        callback();
    }

    preload(callback: (error: any) => void, progressCallback?: (completedCount: number, totalCount: number, item: any) => void) {
        const self = this;
        // Cocos Creator 3.x 中使用 resources.load 替代 cc.loader.loadRes
        resources.load(self.getUrl(), Prefab, progressCallback, (err) => {
            if (err) {
                callback(err);
                return;
            }
            self.onLoading(callback);
        });
    }

    // 加载相应 prefab 资源
    protected load(callback: (error: any) => void) {
        const self = this;
        // Cocos Creator 3.x 中使用 resources.load 替代 cc.loader.loadRes
        resources.load(self.getUrl(), Prefab, (err, prefab) => {
            if (err) {
                callback(err);
                return;
            }
            self.prefab = prefab;
            self.onLoading(callback);
        });
    }

    // 释放 prefab 资源
    protected unload() {
        // Cocos Creator 3.x 中释放资源的方式
        resources.release(this.getUrl(), Prefab);
        sys.garbageCollect();
    }

    // 有的时候界面打开动画会影响到初始化，把会影响到的部分放进这里
    protected afterOpenAnim() { }
    protected onHideOver() { }
    protected onReleaseOver() { }

    // 提供对应的 prefab 资源路径
    abstract getUrl(): string;
    abstract onShow();
    abstract onHide();
    abstract onRelease();
    onRestart() { }

    protected doShow(callback?: (error?: any) => void) {
        if (this.ccNode == null) {
            this.ccNode = instantiate(this.prefab);
            const zIndex: UIZIndex = this.ccNode.getComponent(UIZIndex);
            if (zIndex) {
                this.layer = zIndex.layer;
                this.inLayerIdx = zIndex.localZIndex;
                // Cocos Creator 3.x 中使用 setSiblingIndex 或 zIndex 属性
                this.ccNode.setSiblingIndex(zIndex.localZIndex);
            }
        }
        uiMgr.openUI(this);
        this.playOpenAnim();
        this.onShow();
        callback && callback();
    }

    // 播放打开动画，优先播放名为"ui-open"的动画，如果没有则尝试将动画数组下标为 0 的动画当作界面打开动画
    protected playOpenAnim() {
        const animComp: Animation = this.ccNode.getComponent(Animation);
        if (!animComp) {
            return;
        }
        animComp.play("ui-open");
        // Cocos Creator 3.x 中 Animation.play() 返回 void，使用 defaultClip 获取默认动画
        const defaultClip = animComp.defaultClip;
        if (defaultClip) {
            animComp.scheduleOnce(() => {
                this.afterOpenAnim();
            }, defaultClip.duration);
        } else {
            this.afterOpenAnim();
        }
    }

    // 播放关闭动画，优先播放名为"ui-close"的动画，如果没有则将动画数组中下标为 1 的动画当作界面关闭动画
    protected playCloseAnim(cb: () => void) {
        const animComp: Animation = this.ccNode.getComponent(Animation);
        if (!animComp) {
            return cb();
        }
        // 尝试播放 ui-close 动画
        const clip = animComp.clips.find(c => c.name === "ui-close");
        if (clip) {
            animComp.play("ui-close");
            animComp.scheduleOnce(() => {
                cb();
            }, clip.duration);
        } else {
            // 如果没有 ui-close 动画，使用默认动画
            const defaultClip = animComp.defaultClip;
            if (defaultClip) {
                animComp.play();
                animComp.scheduleOnce(() => {
                    cb();
                }, defaultClip.duration);
            } else {
                cb();
            }
        }
    }

    protected prefab: Prefab;
    protected ccNode: Node;
    protected layer: number = 0;
    protected inLayerIdx: number = 0;
}
