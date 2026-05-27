// 关卡配置接口，对应 Level.csv 的字段定义
export interface LevelConfig {
    /** 主题索引 */
    ThemeIndex: number;
    /** 关卡等级 */
    Level: number;
    /** 初始资金 */
    Money: number;
    /** 怪物批次 */
    MonsterBatch: number;
    /** Bottle 塔是否解锁（1=解锁, 0=未解锁） */
    Bottle: number;
    /** Shit 塔是否解锁 */
    Shit: number;
    /** Fan 塔是否解锁 */
    Fan: number;
    /** Star 塔是否解锁 */
    Star: number;
    /** Ball 塔是否解锁 */
    Ball: number;
    /** FBottle 塔是否解锁 */
    FBottle: number;
    /** BStar 塔是否解锁 */
    BStar: number;
    /** Sun1 塔是否解锁 */
    Sun1: number;
    /** Rocket 塔是否解锁 */
    Rocket: number;
    /** Pin 塔是否解锁 */
    Pin: number;
    /** Snow 塔是否解锁 */
    Snow: number;
    /** Anchor 塔是否解锁 */
    Anchor: number;
    /** Bow 塔是否解锁 */
    Bow: number;
    /** BlueBall 塔是否解锁 */
    BlueBall: number;
    /** PPlane1 塔是否解锁 */
    PPlane1: number;
    /** Dun 塔是否解锁 */
    Dun: number;
    /** MushRoom 塔是否解锁 */
    MushRoom: number;
    /** FishBone 塔是否解锁 */
    FishBone: number;
    /** 胡萝卜类型 */
    CarrotType: number;
    /** 障碍物是否已清理 */
    BarrierClean: number;
}
