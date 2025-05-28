# 贡献指南

感谢您对 YouTV 项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、问题报告和功能建议。

## 🤝 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议，请：

1. 检查 [Issues](https://github.com/YOUYCG/YouTV/issues) 确保问题尚未被报告
2. 使用相应的 Issue 模板创建新的 Issue
3. 提供详细的描述和重现步骤
4. 如果可能，请提供截图或错误日志

### 提交代码

1. **Fork 项目**
   ```bash
   git clone https://github.com/your-username/YouTV.git
   cd YouTV
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **进行开发**
   - 遵循项目的代码规范
   - 添加必要的测试
   - 更新相关文档

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 使用清晰的标题和描述
   - 链接相关的 Issues
   - 等待代码审查

## 📝 代码规范

### TypeScript/JavaScript

- 使用 TypeScript 进行开发
- 遵循 ESLint 配置
- 使用 Prettier 格式化代码
- 添加适当的类型注解
- 编写清晰的注释

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 类型 (type)

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例

```
feat(search): add multi-source search functionality

Add support for searching across multiple video API sources
simultaneously with result aggregation and deduplication.

Closes #123
```

### 代码风格

- 使用 2 个空格缩进
- 使用单引号
- 行末不要分号（JavaScript）
- 最大行长度 100 字符
- 使用 camelCase 命名变量和函数
- 使用 PascalCase 命名类和接口

## 🧪 测试

在提交代码前，请确保：

1. **运行现有测试**
   ```bash
   npm test
   ```

2. **添加新测试**（如果适用）
   - 为新功能添加单元测试
   - 为 bug 修复添加回归测试

3. **手动测试**
   - 在本地环境测试您的更改
   - 确保不会破坏现有功能

## 📚 文档

如果您的更改涉及：

- 新功能：更新 README.md 和相关文档
- API 更改：更新 API 文档
- 配置更改：更新配置说明
- 部署更改：更新部署指南

## 🔍 代码审查

所有的 Pull Request 都需要经过代码审查：

1. **自我审查**
   - 检查代码质量
   - 确保测试通过
   - 验证文档更新

2. **同行审查**
   - 维护者会审查您的代码
   - 可能会要求修改
   - 请及时回应反馈

3. **合并条件**
   - 所有检查通过
   - 至少一个维护者批准
   - 没有冲突

## 🚀 开发环境设置

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn
- Git

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/YouTV.git
   cd YouTV
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **运行测试**
   ```bash
   npm test
   ```

### 开发工具

推荐使用以下工具：

- **编辑器**: VS Code
- **插件**: 
  - TypeScript
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

## 📋 Issue 和 PR 模板

### Bug 报告模板

```markdown
**描述问题**
简要描述遇到的问题。

**重现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
描述您期望发生的情况。

**实际行为**
描述实际发生的情况。

**截图**
如果适用，添加截图来帮助解释您的问题。

**环境信息**
- 操作系统: [例如 Windows 10]
- 浏览器: [例如 Chrome 91]
- 版本: [例如 1.0.0]

**附加信息**
添加任何其他相关信息。
```

### 功能请求模板

```markdown
**功能描述**
简要描述您希望添加的功能。

**问题背景**
描述这个功能要解决的问题。

**解决方案**
描述您希望的解决方案。

**替代方案**
描述您考虑过的其他解决方案。

**附加信息**
添加任何其他相关信息或截图。
```

## 🎯 优先级

我们特别欢迎以下类型的贡献：

1. **高优先级**
   - 安全问题修复
   - 性能优化
   - 关键 bug 修复

2. **中优先级**
   - 新功能开发
   - 用户体验改进
   - 文档完善

3. **低优先级**
   - 代码重构
   - 测试覆盖率提升
   - 开发工具改进

## 📞 联系方式

如果您有任何问题或需要帮助：

- 创建 [Issue](https://github.com/YOUYCG/YouTV/issues)
- 参与 [Discussions](https://github.com/YOUYCG/YouTV/discussions)
- 发送邮件至 [youycg@outlook.com](mailto:youycg@outlook.com)

## 🙏 致谢

感谢所有为 YouTV 项目做出贡献的开发者！您的贡献让这个项目变得更好。

---

再次感谢您的贡献！🎉
