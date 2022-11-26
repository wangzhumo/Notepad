---
title: Rust 学习笔记-Method
lang: zh-CN
tags:
  - Rust
date: 2022-11-26
---

### 定义方法

Rust 使用 `impl` 来定义方法。并且在Rust中数据和方法是分离开来的，要做类比的话，之前写的Unity3d-ECS框架比较像。

其中Entity,Component只用于保持数据，而System则为Component添加了各种方法。

<!-- more -->

![rust-class](https://image.wangzhumo.com/2022/11/rust-class-method.png)

示例：

```rust
pub struct Rect<T>{
    l: T,
    t: T,
    r: T,
    b: T
}

impl<T> Rect<T> {
    // 初始化当前结构体的实例
    pub fn new(l: T, t: T,r: T, b: T) -> Rect<T> {
        Rect{l,t,r,b}
    }
}


// 因为需要计算，所以T不能直接写方法，这里写一个Rect<i32>
impl Rect<i32> {
    // Rect的方法，&self表示借用当前的Rect结构体
    pub fn centerX(&self)->i32 {
        let width = self.r - self.l;
        width / 2
    }
}
```

### self、&self 和 &mut self

`self` 依然有所有权的概念：

- `self` 表示 `Rect` 的所有权转移到该方法中，这种形式用的较少
- `&self` 表示该方法对 `Rect` 的不可变借用
- `&mut self` 表示可变借用

`self` 的使用就跟函数参数一样，要严格遵守 Rust 的所有权规则。

### 关联函数

构造器方法,在Rust中如何定义一个构造器?

只要在函数参数中不包含self即可，如上文中的`Rect::new(l: T, t: T,r: T, b: T)`

> 这种定义在 `impl` 中且没有 `self` 的函数被称之为**关联函数**

因为它没有 `self`，不能用 `f.read()` 的形式调用，因此它是一个函数而不是方法，它又在 `impl` 中，与结构体紧密关联，因此称为关联函数。

### 多个 impl 定义

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```
