---

title: Android开发xml中的样式
lang: zh-CN
tags:
  - Android
date: 2021-10-02
---

### 前言

我们在App中,很多时候需要一个统一的风格,样式.如TextView,EditText,Button,ProgressBar,CheckBox等等,都需要背景,阴影等.我们可以用UI设计师提供的切图,但是如果我们能使用Android提供的`shape、selector、layer-list、level-list、style、theme`等实现会更好.

下面做一个基本使用的笔记.

<!-- more -->

### Shape

shape定义的xml文件我们都是存放在drawable目录下，如果你的项目没有则新建一个.

使用shape可以通过android:shape属性指定下面四种类型的形状

- **rectangle**: 矩形
- **oval**: 椭圆形
- **line**: 线形
- **ring**: 环形

#### 基本属性

- **corners** 设置圆角,rectangle矩形的时候用
  
  可以`radius`使用所有的圆角,也可以单独设置每一个圆角
  
  - android:radius   四个圆角都会使用这个值
  - *android:topLeftRadius* 左上角的半径
  - *android:topRightRadius* 右上角的半径
  - *android:bottomLeftRadius* 左下角的半径
  - *android:bottomRightRadius* 右下角的半径

- **soid**  设置填充色
  
  - android:color  填充色

- **stroke**  设置描边线条
  
  - *android:color* 描边线条颜色
  - *android:width* 描边线条宽度
  - *android:dashWidth* 设置线条为虚线时的横线长度
  - *android:dashGap* 设置线条为虚线时的横线之间的间隔

- **padding**  内容与边界的内间距
  
  - *android:left* 左内间距
  - *android:right* 右内间距
  - *android:top* 上内间距
  - *android:bottom* 下内间距

- **gradient**  这个属性可以给你的图形设置渐变
  
  - android:type 渐变的类型   
    
    - (第一次用方形,哈哈)  linear 线性渐变
    - sweep 扫描渐变
    - radial 放射渐变
  
  - android:startColor 渐变开始的颜色
  
  - android:centerColor  渐变的中间色
  
  - android:endColor  渐变结束的颜色
  
  - android:angle 渐变的角度,当你设置线性渐变可用
  
  - android:centerX  渐变中心的X坐标,当你设置放射渐变有效
  
  - android:centerY   渐变中心的Y坐标 ,当你设置放射渐变有效
  
  - android:gradientRadius  渐变的半径,针对放射渐变

##### rectangle

同基本属性

##### line

stroke & size 组合实现,常用来做EditText的光标

##### oval

- **size**   可以设置图形的宽,高
  - android:width  宽度
  - android:height  高度

其他同基本属性

##### ring

- **android:innerRadius**  里面圆的半径
- **android:innerRadiusRatio**  默认3,便是内圆半径是宽度/3 
- **android:thickness**   环的宽度
- **android:thicknessRatio**  默认是9,表示环的宽度是宽度/9

```xml-dtd
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:innerRadiusRatio="3"
    android:shape="ring"
    android:thicknessRatio="9"
    android:useLevel="false">


    <gradient
        android:endColor="@color/colorAccent"
        android:startColor="#FFFFFF"
        android:type="sweep" />

</shape>
```

图示:

![ring](https://image.wangzhumo.com/2021/09/shape_ring.png)

### Selector

selector可以添加多个Item,表示不同的状态的不同资源.drawable & color

要注意的:

- drawable的资源放在 drawable目录,并且指定的是 android:drawable

- color 的放在color目录,并且指定 android:color 

那么下面我列举出所有的可以设置的状态

- **android:state_enabled**: 设置触摸或点击事件是否可用状态
- **android:state_pressed**: 是否按压状态
- **android:state_selected**: 是否选中状态，true表示已选中，false表示未选中
- **android:state_checked**: 是否勾选状态
- **android:state_checkable**: 勾选是否可用状态
- **android:state_focused**: 是否获得焦点状态
- **android:state_window_focused**: 当前窗口是否获得焦点状态
- **android:state_activated**: 是否被激活状态
- **android:state_hovered**: 是在上面滑动的状态
- **android:enterFadeDuration**  状态改变时的淡入时间
- **android:exitFadeDuration** 状态改变时旧状态消失的淡出

### layout-list

layer-list的作用是把多个drawable按照顺序层叠在一起显示.

它既可以是根节点,也可以作为selector的Item存在.

我们可以使用layer-list的特性来做阴影效果.

```xml-dtd
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:left="4dp"
        android:top="4dp">
        <shape>
            <solid android:color="@android:color/darker_gray" />
            <corners android:radius="10dp" />
        </shape>
    </item>
    <item
        android:bottom="4dp"
        android:right="4dp">
        <shape>
            <solid android:color="@android:color/white" />
            <corners android:radius="10dp" />
        </shape>
    </item>
</layer-list>
```

![layer](https://image.wangzhumo.com/2021/09/layer_list.png)

layer-list的item可以通过以下四个属性来设置偏移量：

- android:top 顶部偏移量
- android:bottom 底部偏移量
- android:left 左边偏移量
- android:right 右边偏移量

### level-list

level-list可以存放多张drawable,每一张drawable对应一定的level范围,使用时通过level值展示对应的drawable

**android:drawable** 指定drawable资源

**android:minLevel** 该Drawable的最小level值

**android:maxLevel** 该Drawable的最大level值

```xml-dtd
<?xml version="1.0" encoding="utf-8"?>
<level-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:drawable="@drawable/draw1"
        android:maxLevel="50"
        android:minLevel="0" />
    <item
        android:drawable="@drawable/draw2"
        android:maxLevel="100"
        android:minLevel="50" />
</level-list>
```
