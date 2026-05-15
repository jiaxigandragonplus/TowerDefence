import { _decorator, Component, Event } from "cc";
import { Logger } from "../logger/Logger";
import { audioMgr } from "./AudioMgr";

const log = new Logger("PlayAudio");
const { ccclass, property, menu } = _decorator;

@ccclass
@menu("ig/all-stage/PlayAudio")
export default class PlayAudio extends Component {
    @property({
        tooltip: "组件被激活时关闭背景音乐"
    })
    stopBg: boolean = false;

    @property({
        tooltip: "组件被激活就播放的背景音乐"
    })
    autoPlayBgURL: string = "";

    @property({
        tooltip: "组件被激活就播放的音效列表"
    })
    autoPlayFxURL: string[] = [];

    @property({
        tooltip: "是否在组件 Disable 的时候停止音效"
    })
    stopFxOnDisable: boolean = true;

    @property({
        tooltip: "是否在激活时自动播放音效"
    })
    autoPlayInEnable: boolean = true;

    disableAutoPlayInEnable(includeChildren: boolean = false) {
        if (includeChildren) {
            if (!this.isLoadedChild) {
                this.childrenComp = this.getComponentsInChildren(PlayAudio);
            }
            this.childrenComp.forEach(value => {
                value.disableAutoPlayInEnable();
            })
        }
        else { //因为 childrenComp 包括了自己，所以这边用 else
            this.originAutoPlayState = this.autoPlayInEnable;
            this.autoPlayInEnable = false;
        }
    }

    restoreAutoPlayInEnable(includeChildren: boolean = false) {
        if (includeChildren) {
            if (!this.isLoadedChild) {
                this.childrenComp = this.getComponentsInChildren(PlayAudio);
            }
            this.childrenComp.forEach(value => {
                value.restoreAutoPlayInEnable();
            })
        }
        else {
            this.autoPlayInEnable = this.originAutoPlayState;
        }
    }

    onEnable() {
        if (this.stopBg) {
            audioMgr.stopBg();
        }
        else {
            const path = this.getPath(this.autoPlayBgURL);
            audioMgr.playBg(path[0], path[1]);
        }

        if (!this.autoPlayInEnable) return;

        this.autoPlayFxURL.forEach(url => {
            const path = this.getPath(url);
            const id = audioMgr.playFx(path[0], path[1]);
            this.stopFxOnDisable && this.aIDsStopOnDisable.push(id);
        });
    }

    onDisable() {
        this.aIDsStopOnDisable.forEach(id => {
            audioMgr.stop(id);
        });
        this.aIDsStopOnDisable = [];
    }

    //通过这个接口播放的背景音乐会在有新的背景音乐播放的时候才停止
    playBgByUrlStopOnMutex(event: Event, url: string) {
        const path = this.getPath(url);
        audioMgr.playBg(path[0], path[1]);
    }

    //通过这个接口播放的时候在组件 onDisable 的时候音效会被停止
    playFxByUrlStopOnDisable(event: Event, url: string) {
        const path = this.getPath(url);
        const id = audioMgr.playFx(path[0], path[1], this.checkPlay.bind(this));
        this.aIDsStopOnDisable.push(id);
    }

    //通过这个接口播放的时候会等音效自己播放结束，如果是循环的就永远不会结束
    playFxByUrlAutoStop(event: Event, url: string) {
        const path = this.getPath(url);
        audioMgr.playFx(path[0], path[1]);
    }

    private checkPlay(): boolean {
        return this.node.activeInHierarchy;
    }

    private getPath(url: string): [string, boolean] {
        if (!url) {
            return [url, false];
        }
        let path = url;
        let i18n = false;
        if (url.indexOf(this.i18nProtocol) === 0) {
            path = url.substr(this.i18nProtocol.length, url.length - this.i18nProtocol.length);
            i18n = true;
        }
        return [path, i18n];
    }

    private readonly i18nProtocol = "i18n://";
    private aIDsStopOnDisable: number[] = [];

    private isLoadedChild: boolean = false;
    private childrenComp: PlayAudio[] = [];
    private originAutoPlayState: boolean;
}
