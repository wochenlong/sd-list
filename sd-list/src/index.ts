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
}

export const Config: Schema<Config> = Schema.object({
  endpoint: Schema.string()
    .description("SD-WebUI 服务器地址。")
    .default("http://127.0.0.1:7860"),
  folderPath: Schema.string().description("本地的lora文件夹路径。").default(""),
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

      try {
        // 读取文件夹中所有文件的文件名
        const files = await fs.promises.readdir(folderPath);
        // 对每个文件名进行处理，去掉后缀名并添加序号
        const fileList = files.map(
          (file, i) => `${i + 1}. ${path.parse(file).name}`
        );
        // 将文件名列表发送到会话中
        session.send(`lora列表：\n${fileList.join("\n")}`);
      } catch (err) {
        // 如果读取文件列表失败，则发送错误消息
        session.send(`读取文件夹 ${folderPath} 失败`);
        logger.error(err);
      }
    });
}
