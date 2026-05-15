import { UIBaseShowWaiting } from "./UIBaseShowWaiting";
import { GenericPool } from "../../../framework/pool/GenericPool";
import { UIBase } from "../../../framework/ui/UIBase";
import { Vec2, Vec3, Node, Prefab, UITransform } from "cc";

class UIShowPrefabMgr {
    async showPrefabByUrl(prefabURL: string,
        worldPos?: Vec2,
        onShow?: (ccNode: Node) => void,
        onHide?: () => void,
        onRelease?: () => void,
        onLoading?: () => Promise<void>
    ): Promise<UIBase> {
        const pool = this.getPool(prefabURL);
        const uiShowPrefab = pool.get();
        uiShowPrefab.setPrefabURL(prefabURL, worldPos);
        uiShowPrefab.setCB(onShow,
            () => {
                onHide && onHide();
                pool.put(uiShowPrefab);
            },
            () => {
                onRelease && onRelease();
                pool.put(uiShowPrefab);
            }, onLoading);
        await uiShowPrefab.show();
        return uiShowPrefab;
    }

    async showPrefabByRef(
        prefabRef: Prefab,
        worldPos?: Vec2,
        onShow?: (ccNode: Node) => void,
        onHide?: () => void,
        onRelease?: () => void,
        onLoading?: () => Promise<void>
    ): Promise<UIBase> {
        const pool = this.getPool(prefabRef.name);
        const uiShowPrefab = pool.get();
        uiShowPrefab.setPrefabRef(prefabRef, worldPos);
        uiShowPrefab.setCB(onShow, () => {
            onHide && onHide();
            pool.put(uiShowPrefab);
        },
            () => {
                onRelease && onRelease();
                pool.put(uiShowPrefab);
            }, onLoading);
        await uiShowPrefab.show();
        return uiShowPrefab;
    }

    private getPool(prefabURL: string): GenericPool<UIShowPrefab> {
        let pool = this.uiPool[prefabURL];
        if (!pool) {
            pool = new GenericPool(UIShowPrefab);
            this.uiPool[prefabURL] = pool;
        }
        return pool;
    }

    private uiPool: { [prefabURL: string]: GenericPool<UIShowPrefab> } = {};
}

class UIShowPrefab extends UIBaseShowWaiting {
    //使用 prefab 路径设置
    setPrefabURL(prefabURL: string,
        worldPos?: Vec2,
    ) {
        this.prefabURL = prefabURL;
        this.worldPos = worldPos;
    }

    //使用 prefab 引用设置
    setPrefabRef(prefabRef: Prefab,
        worldPos?: Vec2,
    ) {
        this.prefabURL = prefabRef.nativeUrl;
        this.prefab = prefabRef;
        this.worldPos = worldPos;
    }

    //设置回调
    setCB(onShow?: (ccNode: Node) => void,
        onHide?: () => void,
        onRelease?: () => void,
        onLoading?: () => Promise<void>
    ) {
        this.onShowCB = onShow;
        this.onHideCB = onHide;
        this.onReleaseCB = onRelease;
        this.onLoadingCB = onLoading;
    }

    protected async onLoading(): Promise<void> {
        if (this.onLoadingCB) {
            await this.onLoadingCB();
        }
    }

    onShow() {
        if (this.worldPos) {
            // Cocos Creator 3.x 中使用 convertToNodeSpaceAR
            const parent = this.ccNode.parent;
            if (parent) {
                const uiTransform = parent.getComponent(UITransform);
                if (uiTransform) {
                    const screenPos = new Vec3(this.worldPos.x, this.worldPos.y, 0);
                    const localPos = uiTransform.convertToNodeSpaceAR(screenPos);
                    this.ccNode.setPosition(localPos);
                }
            }
        }
        this.onShowCB && this.onShowCB(this.ccNode);
    }

    onHide() {
        this.onHideCB && this.onHideCB();
        this.clearCB();
    }

    onRelease() {
        this.onReleaseCB && this.onReleaseCB();
        this.clearCB();
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

    getUrl(): string {
        return this.prefabURL;
    }

    private clearCB() {
        this.onShowCB = null;
        this.onHideCB = null;
        this.onReleaseCB = null;
        this.onLoadingCB = null;
    }

    private prefabURL: string;
    private worldPos: Vec2;
    private onShowCB: (ccNode: Node) => void;
    private onHideCB: () => void;
    private onReleaseCB: () => void;
    private onLoadingCB: () => Promise<void>;
}

export const uiShowPrefabMgr = new UIShowPrefabMgr();
