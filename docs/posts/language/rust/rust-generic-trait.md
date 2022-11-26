---
title: Rust 学习笔记-泛型/特征
lang: zh-CN
tags:
 - Rust 
date: 2022-11-26
---

## 泛型

#### 结构体中使用泛型

```rust
struct Point<T> {
    x: T,
    y: T,
}

struct Point<T,U> {
    x: T,
    y: U,
}
```

这里的结构体例子中：

- **提前声明**，跟泛型函数定义类似，首先我们在使用泛型参数之前必需要进行声明 `Point<T>`，接着就可以在结构体的字段类型中使用 `T` 来替代具体的类型
- **x 和 y 的类型种类**，泛型根据要使用的类型种类声明

#### 枚举中使用泛型

和结构体是一样的使用方式

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

#### 方法中使用泛型

前文中就已经有很好的例子了：

```rust
pub struct Rect<T>{
    l: T,
    t: T,
    r: T,
    b: T
}

pub struct Point<T>{
    x: T,
    y: T
}

// 泛型方法
impl<T> Rect<T> {
    pub fn new(l: T, t: T,r: T, b: T) -> Rect<T> {
        Rect{l,t,r,b}
    }
}

// 为具体的类型实现方法
impl Rect<i32> {

    pub fn centerX(&self)->i32 {
        let width = self.r - self.l;
        width / 2
    }

    pub fn centerY(&self)->i32 {
        let height = self.b - self.t;
        height / 2
    }

    // 把所有权交出去
    pub fn center(&self)-> Point<i32>{
        let point = Point{ x:self.centerX(), y:self.centerY()};
        return point;
    }
}
```

## 特征（Trait）

特征定义了**一个可以被共享的行为，只要实现了特征，你就能使用该行为**。

我就简单的理解为，这就是接口了

### 定义特征

定义特征是把一些方法组合在一起，目的是定义一个实现某些目标所必需的行为的集合。

```rust
pub trait CenterSize {
    fn centerX() -> i32
}
```

这里的定义显然是有问题,centerX的值不一定就是`i32`
要解决这个问题就需要用到特征约束了，下文会提到改进的方法。

### 为类型实现特征

特征只定义行为看起来是什么样的，因此我们需要为类型实现具体的特征，定义行为具体是怎么样的。
这里给`Rect`和`Point`都实现一个`Printable`的特征

```rust
pub struct Rect<T:Display>{
    l: T,
    t: T,
    r: T,
    b: T
}

pub trait Printable{
    fn ToString(&self) -> String;
}

impl<T:Display> Printable for Rect<T> {
    fn ToString(&self) -> String {
        format!("Rect(left: {}, top: {}, right: {}, bottom: {})",self.l,self.t,self.r,self.b)
    }
}
```

#### 默认实现

特征中定义具有默认实现的方法，这样其它类型无需再实现该方法，或者也可以选择重载该方法

```rust

pub trait Printable{
    fn ToString(&self) -> String{
        String.format("@{}",&self)
    }
}


or

pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}

```


### 使用特征作为函数参数

```rust

pub fn PrintObj(obj: &impl Printable){
    println!(obj.ToString());
}
```

其中的含义，`obj`参数可以是任何实现了`Printable`的类型。

### 特征约束(trait bound)

上文中提到的`pub fn PrintObj(obj: &impl Printable)`其实是一个语法糖，其完成的书写形式如下：

```rust
pub fn PrintObj<T:Printable>(obj: &T){
    println!(obj.ToString());
}
```
而其中的`T:Printable`就被称为**特征约束**

#### 多重约束
除了单个约束条件，我们还可以指定多个约束条件。
示例如下：
```rust
pub fn PrintObj<T:Printable + Display>(obj: &T){
    println!(obj.ToString());
}
```
#### Where 约束
看起来很有定语从句的意思，主要是为了在有很多特征约束的情况下，让书写形式更加的简单明了。

```rust
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 {}
```
`T`同时需要满足`Display + Clone`,`U`同时满足`Clone + Debug`
上文的书写形式，看起来就很乱了，如果采用`where`就会显得好一些

```rust
fn some_function<T, U>(t: &T, u: &U) -> i32
    where T: Display + Clone,
          U: Clone + Debug
{}
```

### 函数返回中的 impl Trait

通过 impl Trait 来说明一个函数返回了一个类型
```rust
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        Post {
           // ...
        }
    } else {
        Weibo {
            // ...
        }
    }
}
```
然而这段代码无法通过编译，因为`Post`和`Webio`虽然都实现了`Summary`,但是他们各自是不同的类型。