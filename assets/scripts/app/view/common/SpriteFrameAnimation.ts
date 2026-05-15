import { _decorator, Component, Node, Sprite, SpriteFrame, resources, assetManager, SpriteAtlas } from 'cc';

const { ccclass, property, requireComponent, executionOrder } = _decorator;

/**
 * 序列帧动画配置
 */
export interface AnimConfig {
    /** 动画名称 */
    name: string;
    /** 帧图片名称列表（按顺序） */
    frames: string[];
    /** 帧率（每秒帧数） */
    fps: number;
    /** 是否循环播放 */
    loop: boolean;
    /** 播放完成后是否销毁节点 */
    destroyOnComplete?: boolean;
}

/**
 * 序列帧动画组件
 * 用于播放 plist 打包的序列帧动画
 * 
 * @example
 * // 使用示例
 * const animNode = new Node('anim');
 * const anim = animNode.addComponent(SpriteFrameAnimation);
 * await anim.loadSpriteSheet('Themes/Items/Items01-hd');
 * anim.playAnim('explosion', ['hlb1.png', 'hlb2.png', ...], 24, false);
 */
@ccclass('SpriteFrameAnimation')
@requireComponent(Sprite)
@executionOrder(-100) // 确保在其他组件之前初始化
export class SpriteFrameAnimation extends Component {
    @property({ visible: false })
    private _spriteFrames: Map<string, SpriteFrame> = new Map();

    @property({ visible: false })
    private _currentAnimName: string = '';

    @property({ visible: false })
    private _currentFrames: string[] = [];

    @property({ visible: false })
    private _isPlaying: boolean = false;

    @property({ visible: false })
    private _currentFrameIndex: number = 0;

    @property({ visible: false })
    private _frameInterval: number = 0;

    @property({ visible: false })
    private _loop: boolean = false;

    @property({ visible: false })
    private _destroyOnComplete: boolean = false;

    @property({ visible: false })
    private _onCompleteCallback: (() => void) | null = null;

    private _sprite: Sprite | null = null;
    private _frameTimer: number = 0;

    onLoad() {
        this._sprite = this.getComponent(Sprite);
        if (!this._sprite) {
            this._sprite = this.addComponent(Sprite);
        }
    }

    onDestroy() {
        this.stop();
        this._spriteFrames.clear();
    }

    /**
     * 加载精灵表单（plist 打包的图集）
     * @param plistPath resources 目录下的 plist 路径（不含扩展名）
     * @returns Promise<boolean>
     */
    public async loadSpriteSheet(plistPath: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            console.info(`加载精灵表单：${plistPath}`);
            
            // 加载 plist 文件（SpriteFrame 类型）
            resources.load(plistPath, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                if (err) {
                    console.error(`加载精灵表单失败：${plistPath}`, err);
                    resolve(false);
                    return;
                }

                // 尝试获取关联的 SpriteAtlas
                // 在 Cocos Creator 3.x 中，plist 加载后可以通过 assetManager 获取关联的图集
                assetManager.loadAny({ path: plistPath, type: SpriteAtlas }, (err, atlas: SpriteAtlas) => {
                    if (err) {
                        console.warn(`无法加载图集，尝试直接使用 SpriteFrame: ${plistPath}`);
                        // 如果无法加载图集，至少存储当前的 spriteFrame
                        this._spriteFrames.set(spriteFrame.name, spriteFrame);
                        resolve(true);
                        return;
                    }

                    // 从图集中获取所有精灵帧
                    const spriteFrames = atlas.getSpriteFrames();
                    for (const name in spriteFrames) {
                        this._spriteFrames.set(name, spriteFrames[name]);
                    }
                    console.info(`成功加载 ${Object.keys(spriteFrames).length} 个精灵帧`);
                    resolve(true);
                });
            });
        });
    }

    /**
     * 播放序列帧动画
     * @param animName 动画名称（自定义标识）
     * @param frameNames 帧图片名称数组（如 ['hlb1.png', 'hlb2.png', ...]）
     * @param fps 帧率（每秒帧数）
     * @param loop 是否循环播放
     * @param onComplete 播放完成回调
     */
    public playAnim(
        animName: string,
        frameNames: string[],
        fps: number = 24,
        loop: boolean = false,
        onComplete?: () => void
    ) {
        if (frameNames.length === 0) {
            console.error('帧名称数组为空');
            return;
        }

        this._currentAnimName = animName;
        this._currentFrames = frameNames;
        this._loop = loop;
        this._destroyOnComplete = false;
        this._onCompleteCallback = onComplete || null;
        this._frameInterval = 1000 / fps;
        this._currentFrameIndex = 0;
        this._isPlaying = true;

        // 立即显示第一帧
        this._updateFrame(frameNames[0]);
    }

    /**
     * 播放预配置的动画
     * @param config 动画配置
     * @param onComplete 播放完成回调
     */
    public playConfigAnim(config: AnimConfig, onComplete?: () => void) {
        this._destroyOnComplete = config.destroyOnComplete ?? false;
        this.playAnim(config.name, config.frames, config.fps, config.loop, onComplete);
    }

    /**
     * 停止动画
     * @param reset 是否重置到第一帧
     */
    public stop(reset: boolean = false) {
        this._isPlaying = false;
        this._currentFrameIndex = 0;
        this._currentFrames = [];
        if (reset && this._sprite) {
            this._sprite.spriteFrame = null;
        }
    }

    /**
     * 暂停动画
     */
    public pause() {
        this._isPlaying = false;
    }

    /**
     * 恢复播放
     */
    public resume() {
        if (this._currentFrames.length > 0) {
            this._isPlaying = true;
        }
    }

    /**
     * 获取指定名称的精灵帧
     * @param frameName 帧名称
     * @returns SpriteFrame | null
     */
    public getSpriteFrame(frameName: string): SpriteFrame | null {
        return this._spriteFrames.get(frameName) || null;
    }

    /**
     * 设置显示指定的精灵帧
     * @param frameName 帧名称
     */
    public setFrame(frameName: string) {
        this._updateFrame(frameName);
    }

    /**
     * 是否在播放
     */
    public get isPlaying(): boolean {
        return this._isPlaying;
    }

    /**
     * 当前动画名称
     */
    public get currentAnimName(): string {
        return this._currentAnimName;
    }

    update(deltaTime: number) {
        if (!this._isPlaying || this._currentFrames.length === 0) return;

        this._frameTimer += deltaTime * 1000;

        if (this._frameTimer >= this._frameInterval) {
            this._frameTimer = 0;
            this._nextFrame();
        }
    }

    private _nextFrame() {
        this._currentFrameIndex++;
        
        if (this._currentFrameIndex >= this._currentFrames.length) {
            if (this._loop) {
                this._currentFrameIndex = 0;
                this._updateFrame(this._currentFrames[0]);
            } else {
                this._isPlaying = false;
                this._currentFrameIndex = this._currentFrames.length - 1;
                // 显示最后一帧
                this._updateFrame(this._currentFrames[this._currentFrameIndex]);
                
                // 回调
                if (this._onCompleteCallback) {
                    this._onCompleteCallback();
                }
                
                // 播放完成后销毁节点
                if (this._destroyOnComplete) {
                    this.node.destroy();
                }
            }
        } else {
            this._updateFrame(this._currentFrames[this._currentFrameIndex]);
        }
    }

    private _updateFrame(frameName: string) {
        const spriteFrame = this._spriteFrames.get(frameName);
        if (spriteFrame && this._sprite) {
            this._sprite.spriteFrame = spriteFrame;
        } else {
            console.warn(`未找到精灵帧：${frameName}`);
        }
    }
}
