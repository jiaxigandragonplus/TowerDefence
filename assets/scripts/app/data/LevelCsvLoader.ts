import { CsvDataLoader } from "./CsvDataLoader";
import { LevelConfig } from "./LevelConfig";

/**
 * 关卡配置 CSV 加载器
 * 加载并解析 Level.csv 中的关卡配置数据
 */
export class LevelCsvLoader extends CsvDataLoader<LevelConfig> {
    protected getResUrl(): string {
        return "csv/Level";
    }

    protected mapRow(row: Record<string, string>): LevelConfig {
        return {
            ThemeIndex: parseInt(row["ThemeIndex"]) || 0,
            Level: parseInt(row["Level"]) || 0,
            Money: parseInt(row["Money"]) || 0,
            MonsterBatch: parseInt(row["MonsterBatch"]) || 0,
            Bottle: parseInt(row["Bottle"]) || 0,
            Shit: parseInt(row["Shit"]) || 0,
            Fan: parseInt(row["Fan"]) || 0,
            Star: parseInt(row["Star"]) || 0,
            Ball: parseInt(row["Ball"]) || 0,
            FBottle: parseInt(row["FBottle"]) || 0,
            BStar: parseInt(row["BStar"]) || 0,
            Sun1: parseInt(row["Sun1"]) || 0,
            Rocket: parseInt(row["Rocket"]) || 0,
            Pin: parseInt(row["Pin"]) || 0,
            Snow: parseInt(row["Snow"]) || 0,
            Anchor: parseInt(row["Anchor"]) || 0,
            Bow: parseInt(row["Bow"]) || 0,
            BlueBall: parseInt(row["BlueBall"]) || 0,
            PPlane1: parseInt(row["PPlane1"]) || 0,
            Dun: parseInt(row["Dun"]) || 0,
            MushRoom: parseInt(row["MushRoom"]) || 0,
            FishBone: parseInt(row["FishBone"]) || 0,
            CarrotType: parseInt(row["CarrotType"]) || 0,
            BarrierClean: parseInt(row["BarrierClean"]) || 0,
        };
    }
}
