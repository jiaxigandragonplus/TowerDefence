// 子弹配置接口，对应 Bullet.csv 的字段定义
export interface BulletConfig {
    /** 子弹唯一ID */
    Id: number;
    /** 子弹名称 */
    Name: string;
    /** 模型名称（如 PBottle1, PFan2 等） */
    ModelName: string;
    /** 价值 */
    Value: number;
    /** 动画帧数 */
    AnimationCount: number;
    /** 等级 */
    Level: number;
    /** 状态 */
    State: number;
    /** 飞行速度 */
    Speed: number;
    /** 攻击力 */
    Atk: number;
    /** 持续时间 */
    Duration: number;
    /** 子弹类型 */
    BulletType: number;
    /** 死亡动画帧数 */
    DeadActCount: number;
}
