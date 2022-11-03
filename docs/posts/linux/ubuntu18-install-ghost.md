---
title: Ubuntu18.04 安装Ghost
lang: zh-CN
tags:
  - Linux
date: 2020-08-18
---

## 准备

- 一台服务器(ubuntu18.04)
- Ghost地址 ： https://ghost.org/
- 域名(腾讯云)
- 备案

[How to install & setup Ghost on Ubuntu 16.04, 18.04 and 20.04](https://ghost.org/docs/install/ubuntu/)

<!-- more -->

## 安装

### 创建新用户（用户名：blog）

```shell
# 创建用户
ubuntu@VM-4-13-ubuntu:~$ sudo adduser blog
Adding user `blog' ...
Adding new group `blog' (1002) ...
Adding new user `blog' (1002) with group `blog' ...
Creating home directory `/home/blog' ...
Copying files from `/etc/skel' ...
New password:
Retype new password:
passwd: password updated successfully
Changing the user information for ghost
Enter the new value, or press ENTER for the default
	Full Name []: xxxxx
	Room Number []: 0
	Work Phone []: 0
	Home Phone []: 0
	Other []: 0
Is the information correct? [Y/n] Y

# 加入到sudo用户组
sudo usermod -aG sudo blog

# 试试切换用户
su blog

```

**PS：记得用户名一定不能使用`ghost`**



### 安装Nginx

```shell
# 安装Nginx
sudo apt-get install nginx

# 配置ufw防火墙
sudo ufw allow 'Nginx Full'
```

##### 添加配置文件[TODO]

稍后安装过程中，会自动配置，这里暂时不配置



### 安装Mysql

```shell
# 安装Mysql
sudo apt-get install mysql-server
```

#### Config

```shell
# 进入Mysql
sudo mysql

# Now update your user with this command
# Replace 'password' with your password, but keep the quote marks!
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';

# Then exit MySQL
quit

# and login to your Ubuntu user again
su - <user>

```



### 安装Node.js

```shell
# 添加源
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash

# 安装 Node.js
sudo apt-get install -y nodejs
```



### Install Ghost-CLI

```shell
sudo npm install ghost-cli@latest -g
```

这一步需要一段时间，耐心等待.

### 

### Create Folder

PS：这里我要创建的目录是 `wangzhumo`

安装需要给ghost创建一个目录

```shell
# 创建目录（此时是root所有）
sudo mkdir -p /var/www/wangzhumo

# 更换/var/www/wangzhumo目录的所有者为开始创建的`blog`用户
sudo chown blog:blog /var/www/wangzhumo

# 更改读写权限
sudo chmod 775 /var/www/wangzhumo

# 可以看到当前是 775 读写权限，且所有者是 `blog`
dc2-user@10-255-20-231:/var/www$ ll
total 20
drwxr-xr-x  5 root root 4096 Sep 17 15:30 ./
drwxr-xr-x 14 root root 4096 Sep 16 21:21 ../
drwxr-xr-x  2 root root 4096 Sep 16 21:21 html/
drwxrwxr-x  4 blog blog 4096 Sep 17 16:21 wangzhumo/


# 进入wangzhumo目录
cd /var/www/wangzhumo

```



### Install Ghost

```shell
ghost install
```

这一步需要很长时间，耐心等待.

#### 一段时间后，你需要填写
- host ->   你的域名 eg: wangzhumo.com
-  mysql user ->  root
- mysql password ->  刚才设置的mysql密码
- SSL   ->  因为我们要自己配置，这里拒绝掉

其他的均默认即可



### Config Nginx

```shell
cd /etc/nginx
vim nginx.conf

# 这里查看后发现，配置会包含sites-enabled文件夹里的配置
# include /etc/nginx/sites-enabled

cd /etc/nginx/sites-enabled
ll

dc2-user@10-255-20-231:/etc/nginx/sites-enabled$ ll
total 8
drwxr-xr-x 2 root root 4096 Sep 17 16:13 ./
drwxr-xr-x 9 root root 4096 Sep 16 23:49 ../
lrwxrwxrwx 1 root root   34 Sep 16 21:21 default -> /etc/nginx/sites-available/default
lrwxrwxrwx 1 root root   45 Sep 17 15:47 wangzhumo.com.conf -> /etc/nginx/sites-available/wangzhumo.com.conf

# 这里发现是一个软链，那我们也去/etc/nginx/sites-available中修改

cd /etc/nginx/sites-available
```

#### 强制Https配置

```shell
cd /etc/nginx/sites-available
sudo vim /etc/nginx/sites-available/default

# 修改内容如下
server {
        listen 80;
        
        server_name wangzhumo.com www.wangzhumo.com;
        rewrite ^(.*)$  https://$host$1 permanent;
}
```

#### 配置Ghost的Nginx文件

```shell
cd /etc/nginx/sites-available
sudo vim /etc/nginx/sites-available/wangzhumo.com.conf
# wangzhumo.com.conf 这里是Ghost自动生成的，文件名就是你刚才输入的host

# 配置如下
server {
    listen 443 ssl;

    ssl on;
    ssl_certificate /etc/nginx/cert/Nginx/1_www.wangzhumo.com_bundle.crt;
    ssl_certificate_key /etc/nginx/cert/Nginx/2_www.wangzhumo.com.key;
    server_name wangzhumo.com www.wangzhumo.com;

    location / {
        try_files $uri $uri @ghost-blog;
    }


    location @ghost-blog {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $http_host;
        proxy_pass http://127.0.0.1:2368;

    }

    client_max_body_size 50m;
}


# 重启Nginx
service nginx restart
```

这里配置的`1_www.wangzhumo.com_bundle.crt;`,`2_www.wangzhumo.com.key`

是腾讯云的免费证书,解压后如下：

```shell
.
├── Apache
│   ├── 1_root_bundle.crt
│   ├── 2_www.wangzhumo.com.crt
│   └── 3_www.wangzhumo.com.key
├── IIS
│   ├── keystorePass.txt
│   └── www.wangzhumo.com.pfx
├── Nginx
│   ├── 1_www.wangzhumo.com_bundle.crt
│   └── 2_www.wangzhumo.com.key
├── Tomcat
│   ├── keystorePass.txt
│   └── www.wangzhumo.com.jks
├── www.wangzhumo.com.csr
├── www.wangzhumo.com.key
└── www.wangzhumo.com.pem
```

把Nginx文件夹发送到服务器`scp`,`ftp`,`宝塔`等等手段都可以，放到`/etc/nginx/cert`或者其他目录均可，记得不要给删了即可

直接使用Nginx中的两个文件配置：

    ssl_certificate /etc/nginx/cert/Nginx/1_www.wangzhumo.com_bundle.crt;
    ssl_certificate_key /etc/nginx/cert/Nginx/2_www.wangzhumo.com.key;



### End

网站：[Wangzhumo's Blog](http://localhost:2368/)   https://{host}.com

管理面板：[Ghost Admin](http://localhost:2368/ghost/)   https://{host}.com/ghost
