import { CsvDataLoader } from "./CsvDataLoader";
import { MonsterConfig } from "./MonsterConfig";

/**
 * 怪物配置 CSV 加载器
 * 加载并解析 Monster.csv 中的怪物配置数据
 */
export class MonsterCsvLoader extends CsvDataLoader<MonsterConfig> {
    protected getResUrl(): string {
        return "csv/Monster";
    }

    protected mapRow(row: Record<string, string>): MonsterConfig {
        return {
            Id: parseInt(row["ID"]) || 0,
            Name: row["Name"] || "",
            ModelName: row["ModelName"] || "",
            Value: parseInt(row["Value"]) || 0,
            AnimationCount: parseInt(row["AnimationCount"]) || 0,
            Level: parseInt(row["Level"]) || 0,
            Hp: parseInt(row["Hp"]) || 0,
            Speed: parseInt(row["Speed"]) || 0,
            Atk: parseInt(row["Atk"]) || 0,
        };
    }
}
