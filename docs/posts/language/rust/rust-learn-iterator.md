---
title: Rust 学习笔记-迭代器 Iterator
lang: zh-CN
tags:
 - Rust 
date: 2022-11-30
---
迭代器允许我们迭代一个连续的集合，例如数组、动态数组 `Vec`、`HashMap` 等.
在此过程中，只需关心集合中的元素如何处理，而无需关心如何开始、如何结束、按照什么样的索引去访问等问题。

<!-- more -->

## For循环与迭代器
`For循环`和`Iterator迭代器`主要的差别就是：**是否通过索引来访问集合**。
```rust
for i in 1..10 { 
	println!("{}", i); 
}

let arr = [1, 2, 3];
// `IntoIterator` 特征拥有一个 `into_iter` 方法
//  可以显式的把数组转换成迭代器
for v in arr.into_iter() {
    println!("{}", v);
}
```

## next 方法
```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // 省略其余有默认实现的方法
}
```
最终返回值的类型是**关联类型** `Item`
注意：
- `next` 方法返回的是 `Option` 类型，当有值时返回 `Some(i32)`，无值时返回 `None`
- 遍历是按照迭代器中元素的排列顺序依次进行的，因此我们严格按照数组中元素的顺序取出了 `Some(1)`，`Some(2)`，`Some(3)`
- 手动迭代必须将迭代器声明为 `mut` 可变，因为调用 `next` 会改变迭代器其中的状态数据（当前遍历的位置等），而 `for` 循环去迭代则无需标注 `mut`，因为它会帮我们自动完成

## IntoIterator 特征
> 可以通过 `into_iter` 将其转换为迭代器

#### into_iter, iter, iter_mut
-   `into_iter` 会夺走所有权
-   `iter` 是借用
-   `iter_mut` 是可变借用

其中不同的`iter`返回的数据`Item`也是不一样的：
-   `.iter()` 方法实现的迭代器，调用 `next` 方法返回的类型是 `Some(&T)`
-   `.iter_mut()` 方法实现的迭代器，调用 `next` 方法返回的类型是 `Some(&mut T)`

#### Iterator 和 IntoIterator
`Iterator` 就是迭代器特征 ->  **`next`**

`IntoIterator` 强调的是某一个类型如果实现了该特征，它可以通过 `into_iter`，`iter` 等方法变成一个迭代器 -> **`into_iter`**

## 迭代器的性能