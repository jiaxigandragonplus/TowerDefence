import { AudioSource, Node, Prefab, resources, sys, instantiate } from "cc";
import { Logger } from "../logger/Logger";
import { Utility } from "../utils/Utility";
import AudioSetting from "./AudioSetting";
import { LangSetting } from "../i18n/MultiLanguage";

const log = new Logger("AudioMgr");
type CallbackFunc = (error?: any) => void;
type CheckPlayFunc = () => boolean;

// 音频播放结果
export interface AudioPlayResult {
    id: number;
    audioSource?: AudioSource;
}

//音频管理类，所有音频播放都需要通过 audioMgr 单例实现
class AudioMgr {
    constructor() {
        Utility.forEachEnumMemValue(AudioType, enumValue => {
            if (this.getMusicActive() == "true") {
                this.isMute[enumValue] = false;
                this.volume[enumValue] = 1;
            } else {
                this.isMute[enumValue] = true;
                this.volume[enumValue] = 0;
            }
        });
    }

    //播放音乐 - Promise 版本
    async playBgAsync(filePath: string, i18n: boolean, checkPlayFunc?: CheckPlayFunc): Promise<AudioPlayResult> {
        return new Promise((resolve, reject) => {
            const id = this.playBg(filePath, i18n, checkPlayFunc, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ id, audioSource: this.id2AudioSources[id] });
                }
            });
            if (id == null) {
                reject(new Error("Failed to play background music"));
            }
        });
    }

    //播放音乐 - 回调版本（保持向后兼容）
    playBg(filePath: string, i18n: boolean, checkPlayFunc?: CheckPlayFunc, callback?: CallbackFunc) {
        if (filePath == null || filePath.length <= 0 || filePath === this.bgMusicFilePath) {
            return;
        }
        this.stop(this.bgMusicID);
        this.bgMusicFilePath = filePath;
        this.bgMusicID = this.play(filePath, i18n, checkPlayFunc, callback, AudioType.Bg);
        return this.bgMusicID;
    }

    //停止音乐
    stopBg() {
        this.stop(this.bgMusicID);
    }

    //播放音效 - Promise 版本
    async playFxAsync(filePath: string, i18n: boolean, checkPlayFunc?: CheckPlayFunc): Promise<AudioPlayResult> {
        return new Promise((resolve, reject) => {
            const id = this.playFx(filePath, i18n, checkPlayFunc, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ id, audioSource: this.id2AudioSources[id] });
                }
            });
            if (id == null) {
                reject(new Error("Failed to play sound effect"));
            }
        });
    }

    //播放音效 - 回调版本（保持向后兼容）
    playFx(filePath: string, i18n: boolean, checkPlayFunc?: CheckPlayFunc, callback?: CallbackFunc): number {
        if (filePath == null || filePath.length <= 0) {
            return;
        }

        // 避免音效叠加出现的声音过大的情况。
        if (this.avoidOverlayData[filePath] && Date.now() - this.avoidOverlayData[filePath] < this.avoidOverlayTime) {
            return;
        }
        this.avoidOverlayData[filePath] = Date.now();

        return this.play(filePath, i18n, checkPlayFunc, callback, AudioType.Fx);
    }

    //播放音频 - Promise 版本
    async playAsync(filePath: string, i18n: boolean, checkPlayFunc: CheckPlayFunc, asType: AudioType): Promise<AudioPlayResult> {
        return new Promise((resolve, reject) => {
            const id = this.play(filePath, i18n, checkPlayFunc, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ id, audioSource: this.id2AudioSources[id] });
                }
            }, asType);
            if (id == null) {
                reject(new Error("Failed to play audio"));
            }
        });
    }

    //播放音频 - 回调版本（保持向后兼容）
    play(filePath: string, i18n: boolean, checkPlayFunc: CheckPlayFunc, callback: CallbackFunc, asType: AudioType): number {
        if (!filePath || filePath.length <= 0 || this.isMute[asType]) {
            return;
        }
        const id = this.generateID();
        const i18nPath = i18n === true ? `${LangSetting.getSettingLang()}/` : "cmn/";
        const url = this.basePath + i18nPath + filePath;
        this.id2LoadedURL[id] = url;
        this.id2Status[id] = AudioStatus.Loading;
        this.addRefCnt(url);
        this.load(url).then((audioSource) => {
            //检查是否还需要播放
            if (checkPlayFunc && !checkPlayFunc()) {
                this.stop(id);
                return callback && callback();
            }
            //检查是否已经被停止
            if (this.id2Status[id] == null) {
                this.stop(id);
                return callback && callback();
            }
            audioSource.play();
            // Cocos Creator 3.x 中 AudioSource 没有 mute 属性，使用 volume 控制
            audioSource.volume = this.isMute[asType] ? 0 : this.volume[asType];
            audioSource[this.audioTypeKey] = asType;
            this.id2AudioSources[id] = audioSource;
            this.id2Status[id] = AudioStatus.Playing;
            this.setEaseIn(id, audioSource);
            this.setStopTimeout(id, audioSource);
            callback && callback();
        }).catch((error) => {
            this.stop(id);
            log.error(`play audio ${url} error: ${error}`);
            return callback && callback(error);
        });
        return id;
    }

    //暂停音效音乐
    pause(id: number): boolean {
        this.id2Status[id] = AudioStatus.Paused;
        const audioSource: AudioSource = this.id2AudioSources[id];
        if (audioSource == null) {
            return false;
        }
        audioSource.pause();
        return true;
    }

    //恢复音效音乐 - Cocos Creator 3.x 中使用 play() 恢复暂停的音频
    resume(id: number): boolean {
        this.id2Status[id] = AudioStatus.Playing;
        const audioSource: AudioSource = this.id2AudioSources[id];
        if (audioSource == null) {
            return false;
        }
        audioSource.play();
        return true;
    }

    //停止音效音乐
    stop(id: number): boolean {
        const audioSource: AudioSource = this.id2AudioSources[id];
        this.id2Status[id] = AudioStatus.EaseOut;
        this.setEaseOut(id, audioSource, () => {
            if (audioSource) {
                audioSource.stop();
                audioSource.destroy();
                delete this.id2AudioSources[id];
            }
            const url = this.id2LoadedURL[id];
            if (this.urlRefCnt[url] != null) {
                --this.urlRefCnt[url];
            }
            //如果引用计数为空或者小于等于 0 就御载
            if (this.urlRefCnt[url] == null || this.urlRefCnt[url] <= 0) {
                this.unload(url);
                delete this.id2LoadedURL[id];
            }
            delete this.id2Status[id];
            if (id === this.bgMusicID) {
                this.bgMusicID = undefined;
                this.bgMusicFilePath = undefined;
            }
        });
        return (audioSource != null);
    }

    setMute(beMute: boolean, audioType: AudioType) {
        this.isMute[audioType] = beMute;
        for (let id in this.id2AudioSources) {
            const audioSource = this.id2AudioSources[id];
            if (audioSource[this.audioTypeKey] === audioType) {
                // Cocos Creator 3.x 中 AudioSource 没有 mute 属性，使用 volume 控制
                audioSource.volume = beMute ? 0 : this.volume[audioType];
                sys.localStorage.setItem(this.musicSettingKey, !beMute);
            }
        }
    }

    setVolume(volume: number, audioType: AudioType) {
        this.volume[audioType] = Math.max(volume, 0);
        this.volume[audioType] = Math.min(this.volume[audioType], 1);
        for (let id in this.id2AudioSources) {
            const audioSource = this.id2AudioSources[id];
            if (audioSource[this.audioTypeKey] === audioType) {
                // 只有在未静音时才更新音量
                if (!this.isMute[audioType]) {
                    audioSource.volume = this.volume[audioType];
                }
            }
        }
    }

    //是否指定的 ID 正在播放，注意：即使还没加载完成，只要还没有调用过 pause/stop，这个 ID 就是正在播放
    isPlaying(id: number): boolean {
        return (this.id2Status[id] === AudioStatus.Playing);
    }

    //是否指定的 ID 正在播放，注意：即使还没加载完成，只要还没有调用过 pause/stop，这个 ID 就是正在播放
    isPaused(id: number): boolean {
        return (this.id2Status[id] === AudioStatus.Paused);
    }

    getMusicActive(): string {
        const settingMusic = sys.localStorage.getItem(this.musicSettingKey);
        const sysMusic = settingMusic || "true";
        if (settingMusic == null) {
            sys.localStorage.setItem(this.musicSettingKey, sysMusic);
        }
        return sysMusic;
    }

    private addRefCnt(url: string) {
        if (this.urlRefCnt[url] == null) {
            this.urlRefCnt[url] = 0;
        }
        ++this.urlRefCnt[url];
    }

    // 加载音频 - Promise 版本
    private async load(url: string): Promise<AudioSource> {
        return new Promise((resolve, reject) => {
            resources.load(url, Prefab, (err, prefab) => {
                if (err) {
                    reject(err);
                    return;
                }
                const ccNode: Node = instantiate(prefab);
                const audioSource = ccNode.getComponent(AudioSource);
                resolve(audioSource);
            });
        });
    }

    private unload(url: string) {
        // Cocos Creator 3.x 中释放资源的方式
        resources.release(url, Prefab);
    }

    private generateID(): number {
        return ++this.idSeed;
    }

    private getAudioSettingComp(audioSource: AudioSource): AudioSetting {
        if (!audioSource) {
            return null;
        }
        if (audioSource[this.audioSettingKey]) {
            return audioSource[this.audioSettingKey];
        }
        const setting = audioSource.node.getComponent(AudioSetting);
        audioSource[this.audioSettingKey] = setting;
        return setting;
    }

    private setEaseIn(id: number, audioSource: AudioSource) {
        const setting = this.getAudioSettingComp(audioSource);
        if (!audioSource || !setting || setting.easeIn <= 0) {
            return;
        }
        // Cocos Creator 3.x 中使用 duration 属性而不是 getDuration() 方法
        const easeInDuration = Math.min(setting.easeIn, audioSource.duration / 2);
        const startTime = Date.now();
        const audioType = audioSource[this.audioTypeKey];
        const easeInUpdateFunc = () => {
            const timePassed = (Date.now() - startTime) / 1000;
            const targetVolume = this.volume[audioType];
            if (timePassed > easeInDuration) {
                audioSource.volume = targetVolume;
                audioSource.unschedule(easeInUpdateFunc);
            }
            audioSource.volume = targetVolume * (timePassed / easeInDuration);
            if (audioSource.volume > targetVolume) {
                audioSource.volume = targetVolume;
            }
        }
        audioSource.volume = 0;
        audioSource.schedule(easeInUpdateFunc, 0);
    }

    private setEaseOut(id: number, audioSource: AudioSource, callback: () => void) {
        const setting = this.getAudioSettingComp(audioSource);
        if (!audioSource || !setting || setting.easeOut <= 0) {
            return callback();
        }
        // Cocos Creator 3.x 中使用 duration 属性而不是 getDuration() 方法
        const easeOutDuration = Math.min(setting.easeOut, audioSource.duration / 2);
        const startTime = Date.now();
        const targetVolume = audioSource.volume;
        const easeOutUpdateFunc = () => {
            const timePassed = (Date.now() - startTime) / 1000;
            if (timePassed > easeOutDuration) {
                audioSource.volume = 0;
                audioSource.unschedule(easeOutUpdateFunc);
                callback();
            }
            audioSource.volume = targetVolume * (1 - timePassed / easeOutDuration);
            if (audioSource.volume < 0) {
                audioSource.volume = 0;
            }
        }
        audioSource.schedule(easeOutUpdateFunc, 0);
    }

    private setStopTimeout(id: number, audioSource: AudioSource) {
        const setting = this.getAudioSettingComp(audioSource);
        if (audioSource.loop) {
            if (setting && setting.duration > 0) {
                setTimeout(() => {
                    this.stop(id);
                }, setting.duration * 1000);
            }
        }
        else {
            // Cocos Creator 3.x 中使用 duration 属性而不是 getDuration() 方法
            let duration = audioSource.duration;
            if (setting && setting.duration > 0) {
                duration = Math.min(duration, setting.duration);
            }
            setTimeout(() => {
                this.stop(id);
            }, duration * 1000);
        }
    }
    private musicSettingKey: string = "Music";
    private readonly audioTypeKey = "__audioTypeKey__";
    private readonly audioSettingKey = "__audioSettingKey__";
    private readonly basePath = "audio/";
    private readonly avoidOverlayTime = 100; //声音叠加避免的判断时间。
    private avoidOverlayData: { [url: string]: number } = {};
    private isMute: { [audioType: number]: boolean } = {};
    private volume: { [audioType: number]: number } = {};
    private id2AudioSources: { [id: number]: AudioSource } = {};
    private id2LoadedURL: { [id: number]: string } = {};//如果 id 不存在，表示已经被卸载
    private urlRefCnt: { [url: string]: number } = {};//url 资源被使用次数
    private id2Status: { [id: number]: AudioStatus } = {};
    private idSeed: number = 0;
    private bgMusicID: number;//当前正在播放的背景音乐 ID
    private bgMusicFilePath: string;//当前正在播放的背景音乐文件路径
}

//音频类型
export enum AudioType {
    Fx = 1,//音效
    Bg = 2,//音乐
}

//音频状态
export enum AudioStatus {
    Loading = 1,//正在加载中
    Playing = 2,//正在播放
    Paused = 3,//暂停中
    EaseOut = 4,//正在淡出
}

export const audioMgr = new AudioMgr();
