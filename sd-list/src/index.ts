import { Context, Schema, Logger } from "koishi";
import * as fs from "fs";
import * as path from "path";

export const name = "lora";

export interface Config {
  folderPath?: string;
  loraweights?: number;
  maxCount?: number;
  sendAsImage?: boolean;
}

export const Config: Schema<Config> = Schema.object({
  folderPath: Schema.string()
    .description("lora文件夹路径。")
    .default("D:/a压缩包/lora"),
  loraweights: Schema.number()
    .description("输出lora的默认权重")
    .min(0)
    .max(2)
    .step(0.1)
    .default(0.6),
  maxCount: Schema.number()
    .description("每段最多包含的文件数量")
    .min(1)
    .max(50)
    .step(1)
    .default(20),
  sendAsImage: Schema.boolean()
    .description("是否以图片形式发送")
    .default(false),
});

const logger = new Logger(name);
export function apply(ctx: Context, config: Config) {
  const cmd3 = ctx
    .command("查看lora", "输出lora文件夹下的模型名称")
    .action(async ({ session }) => {
      const folderPath = config.folderPath;
      const loraweights = config.loraweights;

      try {
        // 读取文件夹中所有文件的文件名
        const files = await fs.promises.readdir(folderPath);
        // 对每个文件名进行处理，添加序号和<lora:>标记
        const fileList = files
          .filter((file) =>
            [".safetensors", ".pt"].includes(path.parse(file).ext)
          )
          .map(
            (file, i) =>
              `${i + 1}. <lora:${path.parse(file).name}:${loraweights}>`
          );
        if (fileList.length === 0) {
          session.send(`没有找到符合条件的文件`);
          return;
        }

        // 将文件名列表分段发送到会话中
        const maxCount = config.maxCount; // 每段最多包含的文件数量
        const sectionCount = Math.ceil(fileList.length / maxCount); // 计算需要分成几段发送
        for (let i = 0; i < sectionCount; i++) {
          const sectionList = fileList.slice(i * maxCount, (i + 1) * maxCount); // 获取当前段需要发送的文件列表
          const list = `\n${sectionList.join("\u200B\n")}`;
          const message = config.sendAsImage
            ? `
          <html>
            <style>
              .container {
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .title {
                font-size: 20px;
                font-weight: bold;
                margin-top: 10px;
              }
              .list {
                white-space: pre-wrap;
              }
            </style>
            <div class="container">
              <div class="title">我的lora</div>
              <div class="list">${list}</div>
            </div>
          </html>
        `
            : `lora列表（第 ${i + 1} 段）：\n${sectionList.join("\u200B\n")}`;
          session.send(message);
        }
      } catch (err) {
        // 如果读取文件列表失败，则发送错误消息
        session.send(`读取文件夹 ${folderPath} 失败`);
        logger.error(err);
      }
    });
}
