---
title: Rust 学习笔记-闭包
lang: zh-CN
tags:
 - Rust 
date: 2022-11-29
---

闭包是**一种匿名函数，它可以赋值给变量也可以作为参数传递给其它函数，不同于函数的是，它允许捕获调用者作用域中的值**

```rust
fn main() { 
	let x = 1; 
	let sum = |y| x + y; 
	assert_eq!(3, sum(2)); 
}
```
<!-- more -->
它拥有一个入参 `y`，同时捕获了作用域中的 `x` 的值

## 书写格式
不知道为什么`Rust`要去借鉴`Ruby`，它的闭包形式与`Ruby`不能说是完全一致，只能说是一模一样。
定义如下：
```rust
|param1, param2,...| {
    语句1;
    语句2;
    返回表达式
}
```
如果这个闭包只有一个返回表达式的话，可以简写为如下格式：
```rust
|param1| 返回表达式
```

## 闭包实现
```rust
//! 模拟工作的调用，演示闭包
use std::thread;
use std::time::Duration;

/**
 * 如果workhard函数更换，需要改很多地方，所以这里使用闭包优化
 */
pub fn workout(intensity:u32,random_number:u32){
    if intensity < 25 {
        println!("今天活力满满，先工作 {} 个小时!", workhard(intensity));
    } else if random_number == 3 {
        println!("昨天工作过度了，今天还是休息下吧！");
    } else {
        println!("昨天工作，今天干干有氧，跑步 {} 分钟!",workhard(intensity));
    }
}

/**
 * workout 的闭包版本，现在如果要替换，只需要改动`action`的调用即可
 */
pub fn workoutWithClosure(intensity:u32,random_number:u32){
    let action = || {
        workhard(intensity)
    };

    if intensity < 25 {
        println!("今天活力满满，先工作 {} 个小时!", action());
    } else if random_number == 3 {
        println!("昨天工作过度了，今天还是休息下吧！");
    } else {
        println!("昨天工作，今天干干有氧，跑步 {} 分钟!",action());
    }
}

fn workhard(intensity:u32) -> u32 {
    println!("workhard: {}",intensity);
    thread::sleep(Duration::from_secs(2));
    intensity
}
```
上例中还有两点值得注意:
-   **闭包中最后一行表达式返回的值，就是闭包执行后的返回值**，因此 `action()` 调用返回了 `intensity` 的值 `10`
-   `let action = ||...` 只是把闭包赋值给变量 `action`，并不是把闭包执行后的结果赋值给 `action`，因此这里 `action` 就相当于闭包函数，可以跟函数一样进行调用：`action()`

## 结构体中的闭包
```rust
struct Cacher<T> where T: Fn(u32) -> u32,
{
    query: T,
    value: Option<u32>,
}
```
`Fn(u32) -> u32` 是一个特征，用来表示 `T` 是一个闭包类型，**该闭包拥有一个`u32`类型的参数，同时返回一个`u32`类型的值**。

## 捕获作用域中的值
### 闭包对内存的影响
当闭包从环境中捕获一个值时，会分配内存去存储这些值。函数就不会去捕获这些环境值

### 三种 Fn 特征
#### 1.FnOnce
该类型的闭包会拿走被捕获变量的所有权,且此闭包只运行一次。
```rust
fn fn_once<F>(func: F)
where
    F: FnOnce(usize) -> bool,
{
    println!("{}", func(3));
    println!("{}", func(4));
}

fn main() {
    let x = vec![1, 2, 3];
    fn_once(|z|{z == x.len()})
}


note: this value implements `FnOnce`, which causes it to be moved when called  
--> src/main.rs:5:20  
|  
5 | println!("{}", func(3));  
| ^^^^  
help: consider further restricting this bound  
|  
3 | F: FnOnce(usize) -> bool + Copy,  
| ++++++
```
实现 `FnOnce` 特征的闭包在调用时会转移所有权，所以不能再次去调用这个闭包方法了。

**Copy**
另外，这里还提示我们可以实现`Copy`，这样调用时使用的将是它的拷贝，就不会发生所有权的转移

**move**
如果你想强制闭包取得捕获变量的所有权，可以在参数列表前添加 `move` 关键字
通常用于闭包的生命周期大于捕获变量的生命周期时，例如将闭包返回或移入其他线程。
```rust
use std::thread;
let v = vec![1, 2, 3];
let handle = thread::spawn(move || {
    println!("Here's a vector: {:?}", v);
});
handle.join().unwrap();
```

#### 2. FnMut
以可变借用的方式捕获了环境中的值，因此可以修改该值
```rust
fn main() {
    let mut s = String::new();

    let mut update_string =  |str| s.push_str(str);
    update_string("hello");

    println!("{:?}",s);
}
```


#### 3. Fn 特征
以不可变借用的方式捕获环境中的值
```rust
fn main() {
    let s = "hello, ".to_string();

    let update_string =  |str| println!("{},{}",s,str);

    exec(update_string);

    println!("{:?}",s);
}

fn exec<'a, F: Fn(String) -> ()>(f: F)  {
    f("world".to_string())
}
```

####  三种 Fn 的关系
实际上，一个闭包并不仅仅实现某一种 `Fn` 特征:
-   所有的闭包都自动实现了 `FnOnce` 特征，因此任何一个闭包都至少可以被调用一次
-   没有移出所捕获变量的所有权的闭包自动实现了 `FnMut` 特征
-   不需要对捕获变量进行改变的闭包自动实现了 `Fn` 特征

 >**一个闭包实现了哪种 Fn 特征取决于该闭包如何使用被捕获的变量，而不是取决于闭包如何捕获它们**，跟是否使用 `move` 没有必然联系
 
 