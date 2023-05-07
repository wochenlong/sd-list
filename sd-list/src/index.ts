import { Context, Logger, Schema, trimSlash } from "koishi";
import * as fs from "fs";
import * as path from "path";

export const name = "sd-list";

export const usage = `

查看模型、pt、lora列表

[意见反馈](https://forum.koishi.xyz/t/topic/2018)

`;
export interface Config {
  endpoint?: string;
  folderPath?: string;
  loraweights?: number;
  maxCount?: number;
}

export const Config: Schema<Config> = Schema.object({
  endpoint: Schema.string()
    .description("SD-WebUI 服务器地址。")
    .default("http://127.0.0.1:7860"),
  folderPath: Schema.string().description("本地的lora文件夹路径。").default(""),
  loraweights: Schema.number()
    .description("输出lora的默认权重")
    .min(0)
    .max(2)
    .step(0.1)
    .default(0.6),
  maxCount: Schema.number()
    .description("每段最多包含的lora文件数量")
    .min(1)
    .max(50)
    .step(1)
    .default(20),
});

const logger = new Logger(name);

const MODELS_ENDPOINT = "/sdapi/v1/sd-models";
const PT_ENDPOINT = "/sdapi/v1/embeddings";

export function apply(ctx: Context, config: Config) {
  const cmd1 = ctx
    .command("查看模型", "ai绘画的model列表")
    .action(async ({ session }) => {
      let modelTitles = [];

      async function getModelList() {
        try {
          const res = await ctx.http.get(
            trimSlash(config.endpoint) + MODELS_ENDPOINT
          );
          modelTitles = res.map((model) => model.title);
        } catch (err) {
          session.send(session.text("获取model列表失败"));
          throw err;
        }
      }

      async function sendModels() {
        await getModelList();
        session.send(
          `当前可用model有：\n${modelTitles
            .map((title, i) => `${i + 1}.${title}`)
            .join("\n")}`
        );
      }

      await sendModels();
    });

  const cmd2 = ctx
    .command("查看pt", "ai绘画的pt列表")
    .action(async ({ session }) => {
      let pt = [];

      async function getPtList() {
        try {
          const res = await ctx.http.get(
            trimSlash(config.endpoint) + PT_ENDPOINT
          );
          pt = Object.keys(res.loaded);
        } catch (err) {
          session.send(session.text("获取pt列表失败"));
          throw err;
        }
      }
      async function sendPt() {
        await getPtList();
        session.send(
          `当前可用pt有：\n${pt.map((pt, i) => `${i + 1}.${pt}`).join("\n")}`
        );
      }

      await sendPt();
    });

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
        } else {
          // 将文件名列表分段发送到会话中
          const maxCount = config.maxCount; // 每段最多包含的文件数量
          const sectionCount = Math.ceil(fileList.length / maxCount); // 计算需要分成几段发送
          for (let i = 0; i < sectionCount; i++) {
            const sectionList = fileList.slice(
              i * maxCount,
              (i + 1) * maxCount
            ); // 获取当前段需要发送的文件列表
            session.send(
              `lora列表（第 ${i + 1} 段）：\n${sectionList.join("\u200B\n")}`
            );
          }
        }
      } catch (err) {
        // 如果读取文件列表失败，则发送错误消息
        session.send(`读取文件夹 ${folderPath} 失败`);
        logger.error(err);
      }
    });
}
