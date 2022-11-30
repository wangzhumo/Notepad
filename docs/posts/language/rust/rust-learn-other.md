---
title: Rust 学习笔记-杂项
lang: zh-CN
tags:
 - Rust
date: 2022-11-28
---

## 注释和文档

在 Rust 中，注释分为三类：

- 代码注释，用于说明某一块代码的功能，读者往往是同一个项目的协作开发者
- 文档注释，支持 `Markdown`，对项目描述、公共 API 等用户关心的功能进行介绍，同时还能提供示例代码，目标读者往往是想要了解你项目的人
- 包和模块注释，严格来说这也是文档注释中的一种，它主要用于说明当前包和模块的功能，方便用户迅速了解一个项目

<!-- more -->

### 代码注释

#### 行注释 `//`

```rust
fn main() {
    // 初始化env_logger
    env_logger::init();
}
```

#### 块注释

```rust
fn main() {
    env_logger::init();

    /*
    通过rust的log就可以打印出日志了
    env_logger会做具体实现
    */
    debug!("Hello, world!");
    error!("Hello, world!");
    info!("Hello, world!");

    lesson::ownership::main_ownership();
    let rect:Rect<i32> = Rect::new(0,0,800,400);
    error!("Rect center is {}",rect.ToString());
}
```


### 文档注释

#### 文档行注释 `///`

```rust
/// 获取所有权，然后释放
/// 不会将所有权放出去
pub fn takes_ownership(some_string: String) { 
    // some_string 进入作用域
    println!("{}", some_string);
    // 这里，some_string 移出作用域并调用 `drop` 方法。占用的内存被释放 移出作用域。不会有特殊操作
} 
```

#### 文档块注释 `/**  */`

```rust
/**
 * ## 获取所有权
 * > 基本类型
 * 
 * 移除作用域，不做其他操作。
 */
pub fn makes_copy(some_integer: i32) { 
    // some_integer 进入作用域
    println!("{}", some_integer);
    // 这里，some_integer
}
```

甚至可以在里面写`markdown`语法。

### 包和模块注释

> **这些注释要添加到包、模块的最上方**！

#### 行注释 `//!`

```rust
//! 好家伙，测试一下所有权
pub fn main_ownership() {
  //...
}
```

#### 块注释 `/*! ... */`

```rust
/*!
## 为了演示泛型和Trait写的例子

- Rect 实现类
- Printable Trait
*/

pub mod ownership;
pub mod coord;
```
