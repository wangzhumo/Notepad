---
title: OpenGL 坐标系
lang: zh-CN
tags:
  - OpenGL
date: 2021-10-14
---

![opengl_coordinate_sys](https://image.wangzhumo.com/2021/10/20211014122643.png)


## Code

### 三角形

例如我要绘制一个如下的红色三角形

![TRIANGLES](https://image.wangzhumo.com/2021/10/WechatIMG4.jpeg)

```cpp
const char vertex[] = "attribute vec4 a_position;\n"
                      "\n"
                      "void main() {\n"
                      "    gl_Position = a_position;\n"
                      "}";
const char fragment[] = "precision mediump float;\n"
                        "\n"
                        "void main() {\n"
                        "    gl_FragColor = vec4(1.0,0.0,0.0,1.0);\n"
                        "}";

const float vertexAtt[] = {
        -1.0F, -1.0F,
        1.0F, -1.0F,
        -1.0F, 1.0F
};


// 绘制
glVertexAttribPointer(
            aPosition,
            2,
            GL_FLOAT,
            false,
            8,
            vertexAtt);
// 设置aPosition属性可用
glEnableVertexAttribArray(aPosition);
glDrawArrays(GL_TRIANGLES, 0, 3);
```

这样即可获的一个三角形，但是通常在我们的开发中，我们更关注四边形
不管是显示视频，做翻转，平移等等都是在屏幕的基础上进行。

### 四边形
在window版本上，Opengl是可以直接绘制四边形的，Android设备上只能用两个三角形拼接

#### 版本一
GL_TRIANGLES

```cpp
const float vertexAtt[] = {
        -1.0F, -1.0F,
        1.0F, -1.0F,
        -1.0F, 1.0F,
        -1.0F, 1.0F,
        1.0F,1.0F,
        1.0F,-1.0F
};

glDrawArrays(GL_TRIANGLES, 0, 6);
```
这样就可以得到一个四边形，但是要6个点，数组更长，而且也不好做后续的处理

#### 版本二
GL_TRIANGLE_STRIP
```cpp
const float vertexAtt[] = {
        -1.0F, -1.0F,
        1.0F, -1.0F,
        -1.0F, 1.0F,
        1.0F, 1.0F
};

glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
```

这样也可以得到一个四边形。

`glDrawArrays(GL_TRIANGLE_STRIP, 0, 4)`

会依次绘制点index (0,1,2) (1,2,3) 两组点围成的三角形
也就是说，中间两个点是对角线即可。

## 坐标映射关系

![coordinate](https://image.wangzhumo.com/2021/10/20211014154000.png)


## 空间
![coordinate_2](https://image.wangzhumo.com/2021/10/20211014200738.png)