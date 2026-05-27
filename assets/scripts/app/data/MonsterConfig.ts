// 怪物配置接口，对应 Monster.csv 的字段定义
export interface MonsterConfig {
    /** 怪物唯一ID */
    Id: number;
    /** 怪物名称 */
    Name: string;
    /** 模型名称（如 land_star0, fly_blue0 等） */
    ModelName: string;
    /** 价值（击败后获得的金币） */
    Value: number;
    /** 动画帧数 */
    AnimationCount: number;
    /** 等级 */
    Level: number;
    /** 生命值 */
    Hp: number;
    /** 移动速度 */
    Speed: number;
    /** 攻击力 */
    Atk: number;
}
