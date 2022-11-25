---
title: Rust 学习笔记-所有权/借用
lang: zh-CN
tags:
  - Rust
date: 2022-08-23
---

## 所有权

### 所有权规则

1. Rust 中每一个值都被一个变量所拥有，该变量被称为值的所有者
2. 一个值同时只能被一个变量所拥有，或者说一个值只能拥有一个所有者
3. 当所有者(变量)离开作用域范围时，这个值将被丢弃(drop)

<!-- more -->

### 变量作用域

作用域（scope）,是一个项（item）在程序中有效的范围

```rust
fn main() {
    let s = "world";
    {                      // s 在这里无效, 它尚未声明
        let s = "hello";   // 从此处起，s 是有效的

        // 使用 s
        println!("内部 {s}")
    }                      // 此作用域已结束，s 不再有效
    println!("外部 {s}")
}
```

运行结果是:

```rust
内部 hello
外部 world
```

**变量和其有效的作用域**

* 当 s 进入作用域 时，它就是有效的。
* 这一直持续到它 离开作用域 为止。

### 转移所有权

Rust 采取了一个不同的策略：内存在拥有它的变量离开作用域后就被自动释放。

#### 1.移动（Move）

`String` 类型是一个复杂类型，由**存储在栈中的堆指针**、**字符串长度**、**字符串容量**共同组成，其中**堆指针**是最重要的

```rust
let s1 = String::from("hello");
let s2 = s1;
```

因此，Rust 这样解决问题：**当 `s1` 赋予 `s2` 后，Rust 认为 `s1` 不再有效，因此也无需在 `s1` 离开作用域后 `drop` 任何东西，这就是把所有权从 `s1` 转移给了 `s2`，`s1` 在被赋予 `s2` 后就马上失效了**。

#### 2.克隆(深拷贝)

**Rust 永远也不会自动创建数据的 “深拷贝”**。

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();
    println!("s1 = {}, s2 = {}", s1, s2);
}
```

使用一个叫做 `clone` 的方法,可以做到克隆。

#### 3.拷贝

浅拷贝只发生在栈上，因此性能很高

Rust 有一个叫做 `Copy` 的特征，可以用在类似整型这样在栈中存储的类型。如果一个类型拥有 `Copy` 特征，一个旧的变量在被赋值给其他变量后仍然可用。

> 任何基本类型的组合可以 `Copy` ，不需要分配内存或某种形式资源的类型是可以 `Copy` 的。

 `Copy` 的类型：

- 所有整数类型，比如 `u32`。
- 布尔类型，`bool`，它的值是 `true` 和 `false`。
- 所有浮点数类型，比如 `f64`。
- 字符类型，`char`。
- 元组，当且仅当其包含的类型也都是 `Copy` 的时候。比如，`(i32, i32)` 是 `Copy` 的，但 `(i32, String)` 就不是。
- 不可变引用 `&T` ，**但是注意: 可变引用 `&mut T` 是不可以 Copy的**

### 函数传值与返回

#### 传值

将值传递给函数，一样会发生 `移动` 或者 `复制`

```rust
fn main() {
    let s = String::from("hello");  // s 进入作用域

    takes_ownership(s);             // s 的值移动到函数里 ...
                                    // ... 所以到这里不再有效
    //println!("takes_ownership s {}", s);
    //error : ^ value borrowed here after move

    let x = 5;                      // x 进入作用域

    makes_copy(x);                  // x 应该移动函数里，
                                    // 但 i32 是 Copy 的，所以在后面可继续使用 x
    println!("makes_copys {}", x);   

} 
// 这里, x 先移出了作用域，然后是 s。但因为 s 的值已被移走，
// 所以不会有特殊操作

fn takes_ownership(some_string: String) { // some_string 进入作用域
    println!("{}", some_string);
} // 这里，some_string 移出作用域并调用 `drop` 方法。占用的内存被释放

fn makes_copy(some_integer: i32) { // some_integer 进入作用域
    println!("{}", some_integer);
} // 这里，some_integer 移出作用域。不会有特殊操作
```

#### 返回值

```rust
fn main() {
    let s1 = gives_ownership();         // gives_ownership 将返回值
                                        // 移给 s1

    let s2 = String::from("hello");     // s2 进入作用域

    let s3 = takes_and_gives_back(s2);  // s2 被移动到
                                        // takes_and_gives_back 中,
                                        // 它也将返回值移给 s3
} // 这里, s3 移出作用域并被丢弃。s2 也移出作用域，但已被移走，
  // 所以什么也不会发生。s1 移出作用域并被丢弃

fn gives_ownership() -> String {             // gives_ownership 将返回值移动给
                                             // 调用它的函数

    let some_string = String::from("hello"); // some_string 进入作用域.

    some_string                              // 返回 some_string 并移出给调用的函数
}

// takes_and_gives_back 将传入字符串并返回该值
fn takes_and_gives_back(a_string: String) -> String { // a_string 进入作用域

    a_string  // 返回 a_string 并移出给调用的函数
}
```

## 引用与借用

上文`函数传入与返回值`示例了所有权的转移，但是总是需要先把所有权交给函数，而后函数再把所有权转移给调用方，很繁琐。

Rust提供了`借用（Borrowing）`获取变量的引用。

### 引用与解引用

常规引用是一个指针类型，指向了对象存储的内存地址。

eg:

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

- `&` 取一个变量的引用

- `*` 解引用

和c++里面的指针用法是很一致的。

### 不可变引用

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

`s1`被引用，此时的参数是`&String`，是一个引用类型。

但是此时的引用默认是不可变的，我们只能获取这个引用的值，但是无法去修改它指向的变量。

### 可变引用

和不可变引用比较的话，只需要给参数加上`&mut String` 

**限制：**

**1.同一作用域，特定数据只能有一个可变引用**

```rust
let mut s = String::from("hello");

let r1 = &mut s;
let r2 = &mut s;

println!("{}, {}", r1, r2);
```

上文所示的代码是会报错的，因为同时存在了两个s的可变引用。

限制的目的是避免数据竞争：

- 两个或更多的指针同时访问同一数据
- 至少有一个指针被用来写入数据
- 没有同步数据访问的机制

**2.可变引用与不可变引用不能同时存在**

```rust
let mut s = String::from("hello");

let r1 = &s; // 没问题
let r2 = &s; // 没问题
let r3 = &mut s; // 大问题

println!("{}, {}, and {}", r1, r2, r3);
```

### 悬垂引用

悬垂引用也叫做悬垂指针，意思为指针指向某个值后，这个值被释放掉了，而指针仍然存在，其指向的内存可能不存在任何值或已被其它变量重新使用

```rust
fn main() {
    let reference_to_nothing = dangle();
}

fn dangle() -> &String {
    let s = String::from("hello");

    &s
} //这里 s 离开作用域并被丢弃。其内存被释放。
```

`dangle`函数中，创建了变量`s`，但是并没有把它的所有权交出去，在函数返回完成后，`s`就被解构了，而此时的`reference_to_nothing`却仍然持有`s`的引用。

### 借用规则总结

- 同一时刻，你只能拥有要么一个可变引用, 要么任意多个不可变引用
- 引用必须总是有效的