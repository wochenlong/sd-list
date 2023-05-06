import { Context, Logger, Schema, trimSlash } from "koishi";

export const name = "sd-list";

export interface Config {
  endpoint?: string;
}

export const Config: Schema<Config> = Schema.object({
  endpoint: Schema.string()
    .description("SD-WebUI 服务器地址。")
    .default("http://127.0.0.1:7860"),
});

const logger = new Logger(name);

// 定义两个API的路径常量
const MODELS_ENDPOINT = "/sdapi/v1/sd-models";
const PT_ENDPOINT = "/sdapi/v1/embeddings";

// 定义一个 apply 函数，该函数接收两个参数：Context 和 Config
export function apply(ctx: Context, config: Config) {
  // 创建一个名为 cmd1 的命令，用于获取模型列表
  const cmd1 = ctx
    .command("查看model", "ai绘画的model列表")
    .action(async ({ session }) => {
      // 定义一个空数组，用于存储模型标题
      let modelTitles = [];

      // 定义一个异步函数，用于从API中获取模型列表数据
      async function getModelList() {
        try {
          const res = await ctx.http.get(
            trimSlash(config.endpoint) + MODELS_ENDPOINT
          );
          // 将获取到的模型标题映射到 modelTitles 数组中
          modelTitles = res.map((model) => model.title);
        } catch (err) {
          // 如果出现错误，则在会话中发送错误消息并抛出错误
          session.send(session.text("获取model列表失败"));
          throw err;
        }
      }

      // 定义一个异步函数，用于将模型列表发送到会话中
      async function sendModels() {
        // 调用 getModelList 函数获取模型列表数据
        await getModelList();
        // 将模型标题转换为字符串，并添加序号后发送到会话中
        session.send(
          `当前可用model有：\n${modelTitles
            .map((title, i) => `${i + 1}.${title}`)
            .join("\n")}`
        );
      }

      // 调用 sendModels 函数将模型列表发送到会话中
      await sendModels();
    });

  // 创建一个名为 cmd2 的命令，用于获取 pt 列表
  const cmd2 = ctx
    .command("查看pt", "ai绘画的pt列表")
    .action(async ({ session }) => {
      // 定义一个空数组，用于存储 pt 名称
      let pt = [];

      // 定义一个异步函数，用于从API中获取 pt 列表数据
      async function getPtList() {
        try {
          const res = await ctx.http.get(
            trimSlash(config.endpoint) + PT_ENDPOINT
          );
          // 获取 pt 名称并存储到 pt 数组中
          pt = Object.keys(res.loaded);
        } catch (err) {
          // 如果出现错误，则在会话中发送错误消息并抛出错误
          session.send(session.text("获取pt列表失败"));
          throw err;
        }
      }

      // 定义一个异步函数，用于将 pt 列表发送到会话中
      async function sendPt() {
        // 调用 getPtList 函数获取 pt 列表数据
        await getPtList();
        // 将 pt 名称转换为字符串，并添加序号后发送到会话中
        session.send(
          `当前可用pt有：\n${pt.map((pt, i) => `${i + 1}.${pt}`).join("\n")}`
        );
      }

      // 调用 sendPt 函数将 pt 列表发送到会话中
      await sendPt();
    });
}
