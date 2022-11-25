---
title: Rust 学习笔记-类型/函数/控制流
lang: zh-CN
tags:
  - Rust
date: 2022-08-22
---

## 数据类型

### 标量(scalar types)

**标量**（scalar）类型代表一个单独的值。Rust 有四种基本的标量类型：整型、浮点型、布尔类型和字符类型。

<!-- more -->

#### 1.整形 Integer

| 长度    | 有符号类型   | 无符号类型   |
| ----- | ------- | ------- |
| 8 位   | `i8`    | `u8`    |
| 16 位  | `i16`   | `u16`   |
| 32 位  | `i32`   | `u32`   |
| 64 位  | `i64`   | `u64`   |
| 128 位 | `i128`  | `u128`  |
| arch  | `isize` | `usize` |

进制写法:

| 数字字面量         | 示例            |
| ------------- | ------------- |
| 十进制           | `98_222`      |
| 十六进制          | `0xff`        |
| 八进制           | `0o77`        |
| 二进制           | `0b1111_0000` |
| 字节 (仅限于 `u8`) | `b'A'`        |

#### 2.浮点数（floating-point numbers）

f32 是单精度浮点数，f64 是双精度浮点数。
Rust 的浮点数类型是 f32 和 f64，分别占 32 位和 64 位,默认类型是 f64.

#### 3.布尔型

true 和 false。
Rust 中的布尔类型使用 bool 表示

#### 4.字符类型

Rust的 char 类型是语言中最原生的字母类型,char 类型的大小为四个字节(four bytes)，并代表了一个 Unicode 标量值（Unicode Scalar Value）

**NOTE**: *在 Rust 中，拼音字母（Accented letters），中文、日文、韩文等字符，emoji（绘文字）以及零长度的空白字符都是有效的 char 值。Unicode 标量值包含从 U+0000 到 U+D7FF 和 U+E000 到 U+10FFFF 在内的值。*

### 复合类型(Compound types)

复合类型（Compound types）可以将多个值组合成一个类型,Rust 有两个原生的复合类型：元组（tuple）和数组（array）

#### 1.元组类型

每一个位置都有一个类型，而且这些不同值的类型也不必是相同的,但元组长度固定：一旦声明，其长度不会增大或缩小。

```rust
let tup: (i32, f64, u8) = (500, 6.4, 1);
let (x, y, z) = tup;
let five_hundred = tup.0;
```

#### 2.数组类型

数组中的每个元素的类型必须相同,且长度固定.

```rust
let months = ["January", "February", "March"];
let a: [i32; 5] = [1, 2, 3, 4, 5];

let first = a[0];

// 5 个元素，这些元素的值最初都将被设置为 3
let a = [3; 5];
```

## 语句和表达式

```rust
fn add_with_extra(x: i32, y: i32) -> i32 {
    let x = x + 1; // 语句
    let y = y + 5; // 语句
    x + y // 表达式
}
```

语句会执行一些操作但是不会返回一个值，而表达式会在求值后返回一个值，因此在上述函数体的三行代码中，前两行是语句，最后一行是表达式。

> **表达式总有返回值，而语句是没有返回值的**

eg:

```rust
fn main() {
   let v = {
       let mut x = 1;
       x += 2
   };

   assert_eq!(v, 3);
}
```

这里，赋值操作其实是有返回值的，只是它的返回值是`()`

所以，`x += 2`作为表达式使用的时候会有返回值`()`，就不会通过`assert_eq`

fix:

```rust
fn main() {
   let v = {
       let mut x = 1;
       x += 2;   // 作为语句使用
       x
   };

   assert_eq!(v, 3);
}


fn main() {
   let v = {
       let mut x = 1;
       x + 2    // 作为表达式
   };

   assert_eq!(v, 3);
}
```

## 函数

基本于Kotlin一致

```rust
/// 带返回值的方法
fn func_name (param_name:param_type,....) -> return_type {

}
```

这里的返回值可以是:
1.`return value;`    具体的值
2.`value`            值,不要加; 
3.`{}`               表达式

## 控制流

### IF

```rust
fn main() {
    let number = 6;

    if number % 4 == 0 {
        println!("number is divisible by 4");
    } else if number % 3 == 0 {
        println!("number is divisible by 3");
    } else if number % 2 == 0 {
        println!("number is divisible by 2");
    } else {
        println!("number is not divisible by 4, 3, or 2");
    }
}
```

同时If语句还可以作为表达式

```rust
let number = if condition { 5 } else { 6 };
```

### LOOP

loop 关键字告诉 Rust 一遍又一遍地执行一段代码直到你明确要求停止

#### 1.从循环返回值

```rust
let result = loop {
    counter += 1;

    if counter == 10 {
        break counter * 2;
    }
};
```

#### 2.循环标签

```rust
let mut count = 0;
'counting_up: loop {
    println!("count = {count}");
    let mut remaining = 10;

    loop {
        println!("remaining = {remaining}");
        if remaining == 9 {
            break;
        }
        if count == 2 {
            break 'counting_up;
        }
        remaining -= 1;
    }

    count += 1;
}
```

### WHILE

理解为带if条件的Loop即可

```rust
let mut number = 3;

while number != 0 {
    println!("{number}!");

    number -= 1;
}
```

### FOR

#### 1.遍历集合

```rust
let a = [10, 20, 30, 40, 50];

for element in a {
    println!("the value is: {element}");
}
```

#### 2.Index

```rust
for number in (1..4).rev() {
    println!("{number}!");
}

// [0,5)
for number in 1..5 {
    println!("{number}!");
}

// [0,5]
for number in 1..=5 {
    println!("{number}!");
}
```

### MATCH

#### 1.绑定值的模式

```rust
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        }
    }
}
```

#### 2.匹配 `Option<T>`

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}
```

#### 3.占位符

```rust
match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    _ => reroll(),
}
```