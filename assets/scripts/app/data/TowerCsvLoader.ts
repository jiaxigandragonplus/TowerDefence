import { CsvDataLoader } from "./CsvDataLoader";
import { TowerConfig } from "./TowerConfig";

/**
 * 塔配置 CSV 加载器
 * 加载并解析 Tower.csv 中的塔配置数据
 *
 * 使用示例:
 * ```
 * const loader = new TowerCsvLoader();
 * await loader.load();
 * const allTowers = loader.getAll();
 * const tower1 = loader.getById(1);
 * ```
 */
export class TowerCsvLoader extends CsvDataLoader<TowerConfig> {
    protected getResUrl(): string {
        return "csv/Tower";
    }

    protected mapRow(row: Record<string, string>): TowerConfig {
        return {
            Id: parseInt(row["Id"]) || 0,
            Name: row["Name"] || "",
            ModelName: row["ModelName"] || "",
            Value: parseInt(row["Value"]) || 0,
            AnimationCount: parseInt(row["AnimationCount"]) || 0,
            Level: parseInt(row["Level"]) || 0,
            AttackRange: parseInt(row["AttackRange"]) || 0,
            AttackSpace: parseFloat(row["AttackSpace"]) || 0,
            BulletId: parseInt(row["BulletId"]) || 0,
            UpgradeCost: row["UpgradeCost"] || "",
            TowerBase: row["TowerBase"] || "",
            IsRotation: parseInt(row["IsRotation"]) || 0,
            CreateCost: parseInt(row["CreateCost"]) || 0,
        };
    }
}
