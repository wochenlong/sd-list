import { Context, Logger, Schema, trimSlash } from "koishi";

export const name = "sd-switch";

export interface Config {
  endpoint?: string;
  vaeList?: Array<string>;
}

export const Config: Schema<Config> = Schema.object({
  endpoint: Schema.string()
    .description("SD-WebUI 服务器地址。")
    .default("http://127.0.0.1:7860"),
});

const logger = new Logger(name);

const MODELS_ENDPOINT = "/sdapi/v1/sd-models";
const pt_endpoint = "/sdapi/v1/embeddings";

export function apply(ctx: Context, config: Config) {
  const cmd1 = ctx
    .command("查看模型", "ai绘画的模型列表")
    .alias("获取模型列表")
    .action(async ({ session }) => {
      // 定义一个空数组 models，一个字符串 vae 和一个字符串 model 用于存储当前选择的模型和 VAE
      const models = [];
      let vae = "";
      let model = "";
      let pt = "";

      // 定义函数 getModelList，该函数向 API 发送请求获取模型列表，并将列表中的模型名称存储在 models 数组中
      async function getModelList() {
        try {
          const res = await ctx.http.axios(
            trimSlash(config.endpoint) + MODELS_ENDPOINT
          );
          res.data.forEach((item) => models.push(item.title));
          // 如果获取模型列表失败，向用户发送一个查询失败的消息，并抛出一个 Error
        } catch (err) {
          session.send(session.text("获取模型列表失败"));
          throw err;
        }
      }

      // 定义函数 sendModels，该函数向用户发送可用的模型列表，并提示用户切换模型
      async function sendModels() {
        // 向 API 发送请求获取模型列表
        await getModelList();
        session.send(
          "当前可用模型有：\n" +
            models.map((model, i) => `${i + 1}.${model}\n`).join("")
        );
      }

      // 调用 getModelList 函数并输出模型列表
      await sendModels();
    });
  const cmd2 = ctx
    .command("查看pt", "ai绘画的embeddings列表")
    .alias("获取pt列表")
    .action(async ({ session }) => {
      // 定义一个空数组 models，一个字符串 vae 和一个字符串 model 用于存储当前选择的模型和 VAE
      const models = [];
      let vae = "";
      let model = "";
      let pt = "";

      // 定义函数 getModelList，该函数向 API 发送请求获取模型列表，并将列表中的模型名称存储在 models 数组中
      async function getptList() {
        try {
          const res = await ctx.http.axios(
            trimSlash(config.endpoint) + pt_endpoint
          );
          console.log(res.data); // 输出 res.data 的值
          console.log(Array.isArray(res.data)); // 输出 res.data 是否为数组类型
          res.data.forEach((item) => models.push(item.title));
          // 如果获取模型列表失败，向用户发送一个查询失败的消息，并抛出一个 Error
        } catch (err) {
          session.send(session.text("获取pt列表失败"));
          throw err;
        }
      }

      // 定义函数 sendModels，该函数向用户发送可用的模型列表，并提示用户切换模型
      async function sendpt() {
        await getptList();
        session.send(
          "当前可用pt有：\n" +
            models.map((model, i) => `${i + 1}.${model}\n`).join("")
        );
      }

      // 调用sendpt函数并输出模型列表
      await sendpt();
    });
}
