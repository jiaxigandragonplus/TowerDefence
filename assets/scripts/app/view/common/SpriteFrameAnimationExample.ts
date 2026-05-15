import { _decorator, Component, Node, instantiate, Prefab, resources } from 'cc';
import { SpriteFrameAnimation, AnimConfig } from './SpriteFrameAnimation';

const { ccclass, property } = _decorator;

/**
 * SpriteFrameAnimation 使用示例
 * 
 * 这个脚本展示了如何使用 SpriteFrameAnimation 组件播放序列帧动画
 */
@ccclass('SpriteFrameAnimationExample')
export class SpriteFrameAnimationExample extends Component {
    @property({ type: Prefab })
    public animPrefab: Prefab | null = null;

    // 动画配置示例
    private animConfigs: { [key: string]: AnimConfig } = {
        // 爆炸动画示例（使用 Items01-hd.plist 中的帧）
        'explosion': {
            name: 'explosion',
            frames: [
                'hlb1.png',
                'hlb2.png',
                'hlb3.png',
                'hlb4.png',
                'hlb6.png',
                'hlb8.png',
                'hlb9.png',
                'hlb10.png',
                'hlb11.png',
                'hlb12.png',
                'hlb13.png',
                'hlb14.png',
                'hlb15.png',
                'hlb16.png',
                'hlb17.png',
                'hlb18.png',
            ],
            fps: 24,
            loop: false,
            destroyOnComplete: true, // 播放完成后销毁节点
        },
        // 闪烁动画示例
        'flash': {
            name: 'flash',
            frames: [
                'hlb21.png',
                'hlb22.png',
                'hlb23.png',
            ],
            fps: 12,
            loop: true,
        },
    };

    start() {
        // 示例 1：直接播放动画
        this.playExplosionAt(this.node.position);

        // 示例 2：使用预制体创建动画节点
        // this.spawnAnimFromPrefab(this.node.position);

        // 示例 3：手动控制动画播放
        // this.manualControlExample();
    }

    /**
     * 示例 1：在指定位置播放爆炸动画
     */
    async playExplosionAt(position: any) {
        // 创建动画节点
        const animNode = new Node('ExplosionAnim');
        animNode.setPosition(position);
        this.node.addChild(animNode);

        // 添加动画组件
        const anim = animNode.addComponent(SpriteFrameAnimation);

        // 加载图集
        const loaded = await anim.loadSpriteSheet('Themes/Items/Items01-hd');
        if (!loaded) {
            console.error('加载图集失败');
            animNode.destroy();
            return;
        }

        // 播放爆炸动画
        const config = this.animConfigs['explosion'];
        anim.playConfigAnim(config, () => {
            console.log('爆炸动画播放完成');
        });
    }

    /**
     * 示例 2：从预制体生成动画节点
     */
    async spawnAnimFromPrefab(position: any) {
        if (!this.animPrefab) {
            console.warn('请设置 animPrefab 引用');
            return;
        }

        const animNode = instantiate(this.animPrefab);
        animNode.setPosition(position);
        this.node.addChild(animNode);

        const anim = animNode.getComponent(SpriteFrameAnimation);
        if (anim) {
            await anim.loadSpriteSheet('Themes/Items/Items01-hd');
            anim.playAnim('flash', ['hlb21.png', 'hlb22.png', 'hlb23.png'], 12, true);
        }
    }

    /**
     * 示例 3：手动控制动画播放
     */
    async manualControlExample() {
        const animNode = new Node('ManualAnim');
        this.node.addChild(animNode);

        const anim = animNode.addComponent(SpriteFrameAnimation);
        await anim.loadSpriteSheet('Themes/Items/Items01-hd');

        // 播放动画
        anim.playAnim('manual', ['hlb1.png', 'hlb2.png', 'hlb3.png'], 12, false);

        // 暂停
        // anim.pause();

        // 恢复
        // anim.resume();

        // 停止
        // anim.stop(true);

        // 设置指定帧
        // anim.setFrame('hlb5.png');
    }

    /**
     * 点击事件示例：在点击位置播放动画
     */
    onPlayAnimAtTouch(touchPos: any) {
        this.playExplosionAt(touchPos);
    }
}
