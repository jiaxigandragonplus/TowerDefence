import { Logger } from "../../../framework/logger/Logger";
import { LangSetting } from "../../../framework/i18n/MultiLanguage";
import { Sprite, SpriteFrame, resources, Node, Prefab, instantiate, UITransform } from "cc";

const log = new Logger("res-load-helper");
type Callback = (err?) => void;

export enum ResType {
    None,           //在外部直接指定路径的资源类型
    PlayerPortrait, //玩家的半身像
    ItemIcon,       //物品 icon
    DailyTaskIcon,  //日常任务图标
}

class ResLoadHelper {
    constructor() {
        this.resType2PathMap = {};
        this.resType2PathMap[ResType.None] = "";//在外部直接指定路径的资源类型
        this.resType2PathMap[ResType.PlayerPortrait] = "texture/player/portrait/";//玩家的半身像
    }

    //根据资源类型加载并设置 Sprite
    setSprite(resType: ResType, spriteComp: Sprite, fileName: string, setSize?: boolean, cb?: Callback) {
        const url = this.getPathFromType(resType) + fileName;
        const loadID = this.generateLoadID();
        (spriteComp as any)[this.loadIDSeedKey] = loadID;
        resources.load(url, SpriteFrame, (err, resource: SpriteFrame) => {
            if (err) {
                log.error(`load sprite ${ResType[resType]} error, err = ${err}, url = ${url}`);
            }
            else {
                if (spriteComp &&
                    spriteComp.node &&
                    (spriteComp as any)[this.loadIDSeedKey] === loadID
                ) {
                    spriteComp.spriteFrame = resource;
                    if (setSize === true) {
                        const rect = resource.rect;
                        const uiTransform = spriteComp.node.getComponent(UITransform);
                        if (uiTransform) {
                            uiTransform.setContentSize(rect.width, rect.height);
                        }
                    }
                }
                else {
                    log.debug(`setSprite canceled, url = ${url}, 
            spriteComp[this.loadIDSeedKey] = ${(spriteComp as any)[this.loadIDSeedKey]},
            loadID = ${loadID}`
                    );
                }
            }
            cb && cb(err);
        });
    }

    //根据资源类型加载并设置 Spine，默认播放"Idle"动作
    setSpine(resType: ResType, spineComp: any, fileName: string, animation?: string, cb?: Callback) {
        const url = this.getPathFromType(resType) + fileName;
        const loadID = this.generateLoadID();
        (spineComp as any)[this.loadIDSeedKey] = loadID;
        resources.load(url, (err, resource: any) => {
            if (err) {
                log.error(`load spine ${ResType[resType]} error, err = ${err}, url = ${url}`);
            }
            else {
                if (spineComp &&
                    spineComp.node &&
                    (spineComp as any)[this.loadIDSeedKey] === loadID
                ) {
                    spineComp.skeletonData = resource;
                    spineComp.defaultAnimation = animation || "Idle";
                }
                else {
                    log.debug(`setSpine canceled, url = ${url}, 
            spriteComp[this.loadIDSeedKey] = ${(spineComp as any)[this.loadIDSeedKey]},
            loadID = ${loadID}`
                    );
                }
            }
            cb && cb(err);
        });
    }

    //直接使用指定的 prefab 路径加载并实例化出结点挂接到指定结点上
    setPrefab(resType: ResType, rootNd: Node, fileName: string, cb?: (err?: Error, nd?: Node) => void) {
        const url = this.getPathFromType(resType) + fileName;
        const loadID = this.generateLoadID();
        (rootNd as any)[this.loadIDSeedKey] = loadID;
        let instanceNd: Node = null;
        resources.load(url, Prefab, (err, resource) => {
            if (err) {
                log.error(`load prefab error, err = ${err}, url = ${url}`);
            }
            else {
                if (rootNd &&
                    (rootNd as any)[this.loadIDSeedKey] === loadID
                ) {
                    instanceNd = instantiate(resource);
                    rootNd.addChild(instanceNd);
                }
                else {
                    const errMsg = `setPrefab canceled, url = ${url}, 
          rootNd[this.loadIDSeedKey] = ${(rootNd as any)[this.loadIDSeedKey]},
          loadID = ${loadID}`;
                    log.debug(errMsg);
                    err = new Error(errMsg);
                }
            }
            cb && cb(err, instanceNd);
        });
    }

    //根据资源类型获取相应路径
    getPathFromType(resType: ResType): string {
        return this.resType2PathMap[resType];
    }

    //加载分享使用的图片，如果 url 带 i18n://前缀则到多语言目录加载，否则到 cmn 目录加载
    loadShareImg(url: string, cb: (err: Error, spriteFrame: SpriteFrame) => void) {
        let filePath = url;
        let i18n = false;
        if (url.indexOf(this.i18nProtocol) === 0) {
            filePath = url.substr(this.i18nProtocol.length, url.length - this.i18nProtocol.length);
            i18n = true;
        }
        const i18nPath = i18n === true ? `${LangSetting.getSettingLang()}/` : "cmn/";
        filePath = this.shareTextureBasePath + i18nPath + filePath;
        resources.load(filePath, SpriteFrame, cb);
    }

    private generateLoadID(): number {
        return ++this.loadIDSeed;
    }

    private resType2PathMap: { [key: number]: string };
    private loadIDSeed = 0;
    private loadIDSeedKey = "__loadIDSeedKey__";
    private readonly i18nProtocol = "i18n://";
    private readonly shareTextureBasePath = "texture/share/";
}

export const resLoadHelper = new ResLoadHelper();
