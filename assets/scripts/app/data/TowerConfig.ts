// 塔配置接口，对应 Tower.csv 的字段定义
export interface TowerConfig {
    /** 塔的唯一ID */
    Id: number;
    /** 塔的名称（如 Bottle, Fan, Shit 等） */
    Name: string;
    /** 塔的模型名称（如 Bottle1, Fan2 等） */
    ModelName: string;
    /** 塔的数值（价值/战力） */
    Value: number;
    /** 动画帧数 */
    AnimationCount: number;
    /** 塔的等级 */
    Level: number;
    /** 攻击范围 */
    AttackRange: number;
    /** 攻击间隔（秒） */
    AttackSpace: number;
    /** 使用的子弹ID */
    BulletId: number;
    /** 升级费用，"0_CN" 表示已满级无法升级 */
    UpgradeCost: string;
    /** 塔的底座图片名称 */
    TowerBase: string;
    /** 是否需要旋转朝向目标（1=是, 0=否） */
    IsRotation: number;
    /** 创建费用 */
    CreateCost: number;
}
