// 障碍物/路障配置接口，对应 Barrier.csv 的字段定义
export interface BarrierConfig {
    /** 障碍物唯一ID */
    Id: number;
    /** 障碍物名称 */
    Name: string;
    /** 模型名称（如 cloud01, cloud02 等） */
    ModelName: string;
    /** 价值 */
    Value: number;
    /** 动画帧数 */
    AnimationCount: number;
    /** 等级 */
    Level: number;
    /** 生命值 */
    Hp: number;
}
