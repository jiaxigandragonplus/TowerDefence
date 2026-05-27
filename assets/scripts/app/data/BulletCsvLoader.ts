import { CsvDataLoader } from "./CsvDataLoader";
import { BulletConfig } from "./BulletConfig";

/**
 * 子弹配置 CSV 加载器
 * 加载并解析 Bullet.csv 中的子弹配置数据
 */
export class BulletCsvLoader extends CsvDataLoader<BulletConfig> {
    protected getResUrl(): string {
        return "csv/Bullet";
    }

    protected mapRow(row: Record<string, string>): BulletConfig {
        return {
            Id: parseInt(row["Id"]) || 0,
            Name: row["Name"] || "",
            ModelName: row["ModelName"] || "",
            Value: parseInt(row["Value"]) || 0,
            AnimationCount: parseInt(row["AnimationCount"]) || 0,
            Level: parseInt(row["Level"]) || 0,
            State: parseInt(row["State"]) || 0,
            Speed: parseInt(row["Speed"]) || 0,
            Atk: parseInt(row["Atk"]) || 0,
            Duration: parseInt(row["Duration"]) || 0,
            BulletType: parseInt(row["BulletType"]) || 0,
            DeadActCount: parseInt(row["DeadActCount"]) || 0,
        };
    }
}
