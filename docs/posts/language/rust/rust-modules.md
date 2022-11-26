---
title: Rust 学习笔记-包管理Modules
lang: zh-CN
tags:
 - Rust
date: 2022-08-22
---

## 前言

crate 是一个二进制项或者库。

*crate root* 是一个源文件，Rust 编译器以它为起始点，并构成你的 crate 的根模块。*包*（*package*）是提供一系列功能的一个或者多个 crate。

- 包中至多 **只能** 包含一个库 crate（library crate）

- 包中可以包含任意**多个**二进制crate（binary crate）

<!-- more -->

Rust中我们要先明白crate是一个项目的起点，一切都是从`crate root`开始的

Cargo遵循的一个约定：

- *src/main.rs* 就是一个与包同名的二进制 crate 的 `crate root`

- *src/lib.rs* 是library crate 的 `crate root` 根

<!-- more -->

## 路径

路径有两种形式：

- **绝对路径**（*absolute path*）从 crate 根部开始，以 crate 名或者字面量 `crate` 开头。
- **相对路径**（*relative path*）从当前模块开始，以 `self`、`super` 或当前模块的标识符开头。

### 暴露路径

```rust
mod front_of_house {
    pub mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist();

    // Relative path
    front_of_house::hosting::add_to_waitlist();
}
```

front_of_house::hosting   是公开的

front_of_house::hosting::add_to_waitli   是私有的

- 模块公有并不使其内容也是公有的

- 模块上的 `pub` 关键字只允许其父模块引用

### 相对路径(Super)

使用 `super` 开头来构建从父模块开始的相对路径,

> 和文件系统中的`../`是一致的

相对路径可以让我们随意调整目录，只要保证目录的相对位置不发生变化。

## 公有的结构体和枚举

### 字段值

- **结构体**公有，但是这个结构体的字段仍然是私有的，除非是一个公有字段

- **枚举**设为公有，则它的所有成员都将变为公有

## Use引用/As新名称

```shell
│  .gitignore
│  Cargo.lock
│  Cargo.toml
│
├─src
│  │  lesson.rs
│  │  main.rs
│  │
│  └─lesson
│          ownership.rs





pub mod lesson;

use crate::lesson::ownership as Ow;

fn main() {
    println!("Hello, world!");
    Ow::main_ownership();
}
```

1.使用 `use` 关键字将路径一次性引入作用域，然后调用该路径中的项，就如同它们是本地项一样

> 在作用域中增加 `use` 和路径类似于在文件系统中创建软连接（符号连接，symbolic link）

2.使用`as`关键字，可以对一个路径进行重命名

- 重命名有相同元素的carte

- 缩短字符

- 其他

## pub use重导出名称

当使用 `use` 关键字将名称导入作用域时，在新作用域中可用的名称是私有的。

如果为了让调用你编写的代码的代码能够像在自己的作用域内引用这些类型，可以结合 `pub` 和 `use`。

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```

通过 `pub use`，现在可以通过新路径 `hosting::add_to_waitlist` 来调用 `add_to_waitlist` 函数。如果没有指定 `pub use`，`eat_at_restaurant` 函数可以在其作用域中调用 `hosting::add_to_waitlist`，但外部代码则不允许使用这个新路径

## 将模块分割进不同文件

- 不管怎么组织，总是从`src/main.rs`  or  `src/lib.rs`开始读取的

- `mod.rs`,这是之前版本通用的方法，后续新版本不建议使用

- `modelue name` 一般和路径名能对应上

#### 老版本(使用mod.rs)

> 原文链接 ： [Clear explanation of Rust’s module system](https://www.sheshbabu.com/posts/rust-module-system/)
> 
> 知乎译文 ： [【翻译】关于Rust模块系统的清晰解释](https://zhuanlan.zhihu.com/p/164556350)

总的来说就是，cargo会依据你写的 eg: `front_of_house::hosting` 

默认去找`src/front_of_house/mod.rs`文件，根据你写的内容引用

#### 新版本

如果使用老版本，虽然可以达到目的，但是会产生大量`mod.rs`文件，所以官方建议不要在使用`mod.rs`的方式了；

```rust
// module_name.rs 的形式
│  Cargo.toml
├─src
   │  lesson.rs
   │  main.rs
   └─lesson
        ownership.rs


// module_name/mod.rs  的形式
│  Cargo.toml
├─src
   │  main.rs
   └─lesson
        ├─ mod.rs
        └─ ownership.rs
```

#### 总结

两种方式是等价的，可以自己按需添加使用，但是两者不能是同时作用于同一个模块的
