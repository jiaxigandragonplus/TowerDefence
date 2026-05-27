import { CsvDataLoader } from "./CsvDataLoader";
import { BarrierConfig } from "./BarrierConfig";

/**
 * 障碍物配置 CSV 加载器
 * 加载并解析 Barrier.csv 中的障碍物配置数据
 */
export class BarrierCsvLoader extends CsvDataLoader<BarrierConfig> {
    protected getResUrl(): string {
        return "csv/Barrier";
    }

    protected mapRow(row: Record<string, string>): BarrierConfig {
        return {
            Id: parseInt(row["Id"]) || 0,
            Name: row["Name"] || "",
            ModelName: row["ModelName"] || "",
            Value: parseInt(row["Value"]) || 0,
            AnimationCount: parseInt(row["AnimationCount"]) || 0,
            Level: parseInt(row["Level"]) || 0,
            Hp: parseInt(row["Hp"]) || 0,
        };
    }
}
