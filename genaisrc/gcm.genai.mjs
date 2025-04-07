/**
 * 使用 AI 生成的提交信息自动化 Git 提交流程的脚本。
 * 脚本会检查已暂存的更改，生成提交信息，并提示用户查看或编辑提交信息后进行提交。
 */

script({
    title: "Git 提交信息",
    description: "为所有已暂存的更改生成提交信息",
})

// 检查是否有已暂存的更改，如果没有则暂存所有更改
const diff = await git.diff({
    staged: true,
    askStageOnEmpty: true,
})

// 如果没有发现已暂存的更改，取消脚本并显示提示信息
if (!diff) cancel("没有已暂存的更改")

// 在控制台显示已暂存更改的 diff
// console.log(diff)

// 如果 diff 很大，将其拆分为多个块
const chunks = await tokenizers.chunk(diff, { chunkSize: 10000 })
if (chunks.length > 1)
    console.log(`已暂存的更改被分成 ${chunks.length} 个部分`)

let choice
let message
do {
    // 根据已暂存的更改 diff 生成符合约定式提交规范的提交信息
    message = ""
    for (const chunk of chunks) {
        const res = await runPrompt(
            (_) => {
                _.def("GIT_DIFF", chunk, {
                    maxTokens: 10000,
                    language: "diff",
                    detectPromptInjection: "available",
                })
                _.$`根据 GIT_DIFF 生成符合约定式提交规范的提交信息，用中文表达。

        <类型>: <描述>

        - 类型可以是以下之一：feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
        - 描述是一条简短的、以祈使语气写成的变化说明
        - GIT_DIFF 是 "git diff" 的输出
        - 不要使用 Markdown 语法
        - 不要添加引号、单引号或代码块
        - 保持简短，1 行，不超过 50 个字符
        - 遵循 https://www.conventionalcommits.org/zh-cn/v1.0.0/#specification 的规范
        - 不要混淆以 '-' 开头的删除行和以 '+' 开头的新增行
        - 描述信息最后加上由什么模型生成，其中'什么模型'指的是生成提交信息所使用的 LLM 模型的名称，例如 'deepseek-chat'
        - 只返回提交信息，不要输出其他内容
        `
            },
            {
                model: "deepseek-chat", // 指定用于生成提交信息的 LLM 模型
                label: "生成提交信息", // 提示任务的标签
                system: [
                    "system.assistant",
                    "system.safety_jailbreak",
                    "system.safety_harmful_content",
                    "system.safety_validate_harmful_content",
                ],
            }
        )
        if (res.error) throw res.error
        message += res.text + "\n"
    }

    // 如果有多个块，将生成的提交信息压缩为一条
    if (chunks.length > 1) {
        const res =
            await prompt`将 COMMIT_MESSAGES 中的提交信息总结为一条符合约定式提交规范的提交信息。

        <类型>: <描述>

        - 类型可以是以下之一：feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
        - 描述是一条简短的、以祈使语气写成的变化说明
        - 不要使用 Markdown 语法
        - 不要添加引号或代码块
        - 保持简短，1 行，不超过 50 个字符
        - 遵循 https://www.conventionalcommits.org/zh-cn/v1.0.0/#specification 的规范
        - 不要混淆以 '-' 开头的删除行和以 '+' 开头的新增行
        - 描述信息最后加上由什么模型生成，其中'什么模型'指的是生成提交信息所使用的 LLM 模型的名称，例如 'deepseek-chat'
        - 只返回提交信息，不要输出其他内容

        COMMIT_MESSAGES:
        ${message}
        `.options({
                model: "deepseek-chat",
                label: "总结块提交信息",
                system: [
                    "system.assistant",
                    "system.safety_jailbreak",
                    "system.safety_harmful_content",
                    "system.safety_validate_harmful_content",
                ],
            })
        if (res.error) throw res.error
        message = res.text
    }

    message = message?.trim()

    if (!message) {
        console.log(
            "未生成提交信息，你是否正确配置了 LLM 模型？"
        )
        break
    }

    // 提示用户接受、编辑或重新生成提交信息
    choice = await host.select(message, [
        {
            value: "commit",
            description: "接受提交信息并提交",
        },
        {
            value: "edit",
            description: "编辑提交信息并提交",
        },
        {
            value: "regenerate",
            description: "重新生成提交信息",
        },
    ])

    // 根据用户的选择处理提交信息
    if (choice === "edit") {
        message = await host.input("编辑提交信息", {
            required: true,
        })
        choice = "commit"
    }
    // 如果用户选择提交，执行 git commit 并提示是否推送更改
    if (choice === "commit" && message) {
        console.log(await git.exec(["commit", "-m", message]))

        // 获取当前分支名称
        const branchName = await git.branch()
        console.log(`当前分支: ${branchName}`);
        if (await host.confirm("推送更改？", { default: true })) {
            // const pushCommand = `git push origin HEAD:refs/for/${branchName}`;
            // console.log(`执行推送命令: ${pushCommand}`);
            // console.log(await git.exec(pushCommand.split(" ")));
            const pushCommand = `git push`;
            console.log(`执行推送命令: ${pushCommand}`);
            const data = await host.exec(pushCommand);
            console.log(data.stderr);
            // console.log(await host.exec(pushCommand));
        }
        break
    }
} while (choice !== "commit")
