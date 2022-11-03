---
title: 认识时域与频域
lang: zh-CN
tags:
  - Protocal
date: 2021-10-23  
---

## 前言

我也没想到我有一天会捡起这些东西，我一个数学弱鸡压力山大。
起因是最近在学习音视频开发，我发现一涉及到理论知识这块，总会有几个 时域，频域，傅里叶变化这样的名词出现。

<!-- more -->

链接：

> 信号频域和时域的关系？
> https://www.zhihu.com/question/21040374

想学习一个东西，首先要搞明白是什么？然后才能继续去认识它。
而我始终认为，学习也是由浅入深的，由点及面的，不可能一上来就认识到了它的核心理论。

## 简单的认识

> @航空航天迷 
> 
> https://www.zhihu.com/people/jin-it/activities

这位大兄弟的图是我的启蒙。

这张图就是一个时域图，可以看到这个正弦波，x轴上是时间的变化，y轴就是振幅了

- 频率 ：6Hz
- 振幅 ：5V
  这里就是图1中正弦波的频域图
  我们可以看到x轴是频率了，y轴就是振幅了
  其中绿色的线，其x轴的交点是指这个正弦波的频率是6,它的高度就是这个正弦波的波峰了5V

## 进一步认识

来自：

> @一二
> 
> https://www.zhihu.com/people/yier-64/activities
> https://zh.wikipedia.org/wiki/%E5%82%85%E9%87%8C%E5%8F%B6%E5%8F%98%E6%8D%A2#

傅里叶变换将函数的时域（红色）与频域（蓝色）相关联
刚开始的时候我没看前面` @航空航天迷`的答案，直接在CSDN上查的，然后就我懵逼了。
https://blog.csdn.net/jiujiaobusiniao/article/details/53321491
盯着这几张图看了很久，很久。。。

### 开始理解

> @Heinrich
> https://www.zhihu.com/people/Erdnussoelbearbeiter/activities
> 傅里叶分析之掐死教程
> https://zhuanlan.zhihu.com/p/19763358?refer=wille

真的是给大佬递烟。
下一步我们就看看傅里叶变换
