---
title: OpenGL glsl的基本语法[转]
lang: zh-CN
tags:
  - OpenGL
date: 2021-10-14
---

> 简书地址
> 
> [GLSL基础语法介绍](https://www.jianshu.com/p/66b10062bd67)

## 简单实例

```cpp
const char vertex[] = "attribute vec4 vPosition;\n"
                      "attribute vec2 fPosition;\n"
                      "varying vec2 ftPosition;\n"
                      "\n"
                      "void main() {\n"
                      "    ftPosition = fPosition;\n"
                      "    gl_Position = vPosition;\n"
                      "}";
const char fragment[]="precision mediump float;\n"
                       "varying vec2 ftPosition;\n"
                       "uniform sampler2D sTexture;\n"
                       "\n"
                       "void main() {\n"
                       " gl_FragColor=texture2D(sTexture,ftPosition);\n"
                       "}";

```

* attribute 用于vertex中，可以由application传递数据，表示只读的顶点数据，只用在顶点着色器中。
* varying  用于vertex与fragment中传递数据，顶点着色器的输出。例如颜色或者纹理坐标，（插值后的数据）作为片段着色器的只读输入数据
* uniform  一致变量。在着色器执行期间一致变量的值是不变的。与const常量不同的是，这个值在编译时期是未知的是由着色器外部初始化的。一致变量在顶点着色器和片段着色器之间是共享的。它也只能在全局范围进行声明。