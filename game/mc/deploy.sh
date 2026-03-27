#!/bin/bash

# Minecraft Shop Game - 部署到 GitHub Pages

echo "==================================="
echo "Minecraft 商店模拟器部署脚本"
echo "==================================="
echo ""

# 检查是否已初始化 git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git add .
    git commit -m "Initial commit - Minecraft Shop Game"
    
    echo ""
    echo "请输入你的 GitHub 用户名:"
    read username
    
    echo ""
    echo "请输入你创建的仓库名称（例如：minecraft-shop）:"
    read repo
    
    echo ""
    echo "请输入你的 GitHub token（从 https://github.com/settings/tokens 生成，需要 repo 权限）:"
    read -s token
    
    # 创建远程仓库
    echo ""
    echo "🔧 创建远程仓库..."
    curl -X POST \
      -H "Authorization: token $token" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/user/repos \
      -d "{\"name\":\"$repo\",\"description\":\"Minecraft 商店模拟器\",\"private\":false}"
    
    # 添加远程仓库并推送
    git branch -M main
    git remote add origin https://$username:$token@github.com/$username/$repo.git
    git push -u origin main
    
    echo ""
    echo "✅ 代码已推送到 GitHub！"
    echo "🌐 访问地址：https://$username.github.io/$repo/"
    echo ""
    echo "下一步："
    echo "1. 访问 https://github.com/$username/$repo/settings/pages"
    echo "2. Source 选择 'Deploy from a branch'"
    echo "3. Branch 选择 'main'，文件夹选择 '/ (root)'"
    echo "4. 点击 Save，等待几分钟部署完成"
    
else
    echo "Git 仓库已存在，检查是否有更改..."
    
    # 检查是否有更改
    if [ -n "$(git status --porcelain)" ]; then
        echo ""
        echo "📝 发现更改，提交并推送..."
        git add .
        git commit -m "Update game files"
        git push
        echo "✅ 更新已推送！"
    else
        echo "✅ 没有新的更改"
    fi
fi

echo ""
echo "==================================="
