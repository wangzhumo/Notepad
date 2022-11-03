---
title: linux基本权限
lang: zh-CN
tags:
  - Linux
date: 2020-08-18
---


```
-rw-r--r--   1 phyooos  staff   746B  5 15 23:43 keystore.pub
drwxr-xr-x   7 phyooos  staff   238B  5 17 13:19 library
-rwxr-xr-x@  1 phyooos  staff   7.4M  3  1 15:25 natapp
drwxr-xr-x   4 phyooos  staff   136B  6 19 17:03 tomcat-7.0.78
drwxr-xr-x   8 phyooos  staff   272B  4 24 20:30 workspace
```
<!-- more -->


linux基本权限 `-rw-r--r-- ` 共10位

```
#第一位
- 文件类型   (-文件   d文件夹 l软连接 )
#第2-4(第一个三位)
rw-  u 所属者的读写等权限

#第5-7(第二个三位)
r--  g 所属者的读写等权限

#第7-10(第三个三位)
r--  o  其他人的权限

r 可读
w 可写
x 可执行

```

## 权限的修改

```
chmod [选项] [模式] [文件名]
  
  选项  
  -R   递归
  
  模式
  用户,用户组,其他人 + 权限(rwx)  可以用 "," 分隔多个
    eg:   
    chmod u+x wenjian.mp4   + 号代表赋予
    chmod u-w wenjian.mp4   - 号代表去掉写入权限
    chmod g+r,o+r wenjian.mp4
    chmod a=rwx wanjian.mp4

#权限数字表达方式
r   ----  4
w   ----  2
x   ----  1
  
rwx r-x r-x  
  
chmod 744 wenjian.mp4
其中
  数字 744   7代表所属者 rwx权限
            4代表所属组  r权限
            4代表其他人  r权限  
            
    常用 777  744 644 755 
```


## 权限对文件和目录的作用

### 对文件的作用

```
r  读取文件(cat more tail head)
w  编辑,新增,修改文件内容 (vi echo )
       但是不能删除
x  可以执行       
```

### 对目录的作用

```
r  可以查询目录下的文件(ls)
w  具有修改目录结构的权限 (touch rm mv cp)
x  可以进入目录(cd)


所以对文件来说  权限 0  5(rx)  7(rwx)
```

## 文件所有者

```
chown [用户]:[用户组] [文件名]

  chwon user1 wenjian
  
  chown root:root wenjian
 

```


## 添加用户  用户组

```
adduser user1
passwd user1
#创建一个用户了

groupadd users
#创建一个组
gpasswd -a user1 users
#把用户user1加入users组
```

## 文件与目录的默认权限

### 文件的默认

```
1. 文件的默认权限不能为执行文件,必须手工赋予执行权限
2. 文件默认最大为666
3. 默认权限需要换算为字母再相减
    默认最大 666     umask 022
    -rw- rw- rw-  减去  - --- -w- -w-
    
    其实是做了与运算.

```

### 目录的默认权限

```
1. 目录的默认最大为777
3. 默认权限需要换算为字母再相减
    默认最大 777     umask 022
    -rwx rwx rwx  减去  - --- -w- -w-
    
    -rwx r-x r-x
    
    其实是做了与运算.

```

## 修改umask的值

```
#临时修改
umask 0000    
umask 0022

其中  第一个0 是指特殊权限
    022是目录或文件的   操作对象
    
#永久修改
vi /etc/profile 
$UID > 199 
root  uid为0
用户自己创建的  uid 一般大于 500    
```