# 杖剑传说地图 (Zhejiang Map Application)

这是一个基于Leaflet的地图应用，展示了杖剑传说地图上的资源点信息。

## 项目结构

- `index.html`: 主页面
- `src/`: 源代码目录
  - `css/`: 样式文件
  - `js/`: JavaScript文件
  - `data/`: 数据文件
  - `img/`: 图片资源
- `docs/`: 文档目录

## 部署到GitHub Pages的详细步骤

### 1. 在GitHub上创建新的存储库

1. 登录到你的GitHub账户
2. 在GitHub主页右上角，点击"+"按钮，然后选择"New repository"
3. 为存储库命名（例如：zjmap）
4. 选择存储库为"Public"（公共）
5. **重要**：不要勾选"Initialize this repository with a README"
6. 点击"Create repository"

### 2. 将本地代码推送到GitHub

在本地项目的根目录（d:\code\zjmap）下打开Git Bash或命令行工具，然后执行以下命令：

```bash
# 将本地仓库与GitHub存储库关联（请将<your-username>替换为你的GitHub用户名）
git remote add origin https://github.com/yinyingyang/zjmap.git

# 推送代码到GitHub
git push -u origin master
```

### 3. 启用GitHub Pages

1. 在GitHub存储库页面，点击"Settings"选项卡
2. 向下滚动到"Pages"部分
3. 在"Source"下拉菜单中，选择"master"分支
4. 点击"Save"按钮
5. 等待几分钟后，页面会显示你的网站URL

## 开发

要运行此应用，只需在浏览器中打开 `index.html` 文件即可。

## 许可证

本项目采用MIT许可证 - 查看[LICENSE](LICENSE)文件了解详情。