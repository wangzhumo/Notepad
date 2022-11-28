---
title: Rust 学习笔记-生命周期
lang: zh-CN
tags:
 - Rust
date: 2022-11-28
---

生命周期，简而言之就是引用的有效作用域,大多数时候，我们无需手动的声明生命周期.
- 编译器大多数时候也可以自动推导生命周期
- 多种类型存在时，编译器往往要求我们手动标明类型 <-> 当多个生命周期存在，且编译器无法推导出某个引用的生命周期时，就需要我们手动标明生命周期

<!-- more -->

为什么，Rust会需要Liferecycle这种概念的？是为了避免悬垂引用，借用检查的时候会使用。

其实，对于我这种前Android开发，是有一些比较好的类比对象的。就是Android面试题里面常常出现的一个问题：为什么会产生内存泄漏。

- Activity,Context 被Application或者单例类引用
- Fragment被Activity引用
- 等等

均是由于生命周期长的引用了生命周期短的，导致短生命周期的无法按照预期释放，从而造成内存泄漏的问题。


## 借用检查
为了保证 Rust 的所有权和借用的正确性，Rust 使用了一个借用检查器(Borrow checker)

```rust
{
    let r;                // ---------+-- 'a
                          //          |
    {                     //          |
        let x = 5;        // -+-- 'b  |
        r = &x;           //  |       |
    }                     // -+       |
                          //          |
    println!("r: {}", r); //          |
}                         // ---------+
```
 `r` 明明拥有生命周期 `'a`，但是却引用了一个小得多的生命周期 `'b`，在这种情况下，编译器会认为我们的程序存在风险，因此拒绝运行。


## 标记生命周期
看到上面的例子，生命周期无非是因为编译器无法自己分析出来生命周期而需要开发者去标注。

> 标记的生命周期只是为了编译器，让编译器能正常的运行。


**生命周期语法用来将函数的多个引用参数和返回值的作用域关联到一起，一旦关联到一起后，Rust 就拥有充分的信息来确保我们的操作是内存安全的。**

#### 函数签名中的生命周期标注

```rust
pub fn longest(x:&str, y:&str) -> &str{
    if x.len() > y.len() {
        x
    }else{
        y
    }
}
```
以上的代码会报错：

```rust
`error[E0106]: missing lifetime specifier`
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
help: consider introducing a named lifetime parameter
  |
1 | pub fn longest<'a>(x:&'a str, y:&'a str) -> &'a str{
  |   
```

而且，给出了修复的建议，因为`x,y`都是借用来的，`return`无法确定到底返回的是哪一个，所以无法确定生命周期。

那么我们修改如下：
```rust
pub fn longest<'a>(x:&'a str, y:&'a str) -> &'a str{
    if x.len() > y.len() {
        x
    }else{
        y
    }
}
```
这个意思就是说，`x,y`以及返回值起码得和函数生命`'a`一样久，这样你才能来调用我。

**注意：**
- 和泛型一样，使用生命周期参数，需要先声明 `<'a>`
- `x、y` 和返回值至少活得和 `'a` 一样久(因为返回值要么是 x，要么是 y)
- 我们并未真正的修改`x,y`的生命周期，只是告知编译器，这样子的生命周期是可以通过编译的


错误示例：
```rust
fn main() {
    let string1 = String::from("long string is long");         // ---------+-- 'a
    let result;                                                //          |
    {                                                          //          |
        let string2 = String::from("xyz");                     // -+-- 'b  | 
        result = longest(string1.as_str(), string2.as_str());  //  |       |
    }                                                          // -+       |
    println!("The longest string is {}", result);              //          |
}                                                              // ---------+
```

这里输入参数，`string1`的生命周期是`'a` 而 `string2`的生命周期是`'b`
```rust
error[E0597]: `y` does not live long enough
```

问题在于，`x,y`被借用之后，直接返回的是`result`就是`x or y`。所以在最后`println!`打印的时候仍然需要`string2`，然而`string2`在出了花括号之后就解构了，那就有问题了。


**函数的返回值的生命周期来源：**

- 函数参数的生命周期
- 函数体中某个新建引用的生命周期


#### 结构体中的生命周期

结构体中使用引用，要为结构体中的**每一个引用标注上生命周期**。

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}
```

错误示例：
只需要满足，传入的参数比`ImportantExcerpt`的生命周期要小就行。
```rust
fn main() {
    let i;
    {
        let novel = String::from("Call me Ishmael. Some years ago...");
        let first_sentence = novel.split('.').next().expect("Could not find a '.'");
        i = ImportantExcerpt {
            part: first_sentence,
        };
    }
    println!("{:?}",i);
}
```

上面的例子中，`i`显然是在生命周期`'a`了，而`first_sentence`在生命周期`'b`,显然是比`i`要小的
`error[E0597]: `novel` does not live long enough`

## 生命周期消除
就是指编译器自己的优化行为。
比如说**函数的返回值的生命周期来源：**

- 函数参数的生命周期
- 函数体中某个新建引用的生命周期

不可能还有其他的来源了，而函数的参数作为返回值，返回值和参数的生命周期一定是一致的，所以这种情况下，无需再讨论生命周期了，一定是满足的。
这种情况下，编译器不需要你主动去标记生命周期，这既是**生命周期的消除**

函数或者方法中，参数的生命周期被称为 `输入生命周期`，返回值的生命周期被称为 `输出生命周期`

**三条消除规则**
1. **每一个引用参数都会获得独自的生命周期**
   
   例如一个引用参数的函数就有一个生命周期标注: fn foo<'a>(x: &'a i32)，两个引用参数的有两个生命周期标注:fn foo<'a, 'b>(x: &'a i32, y: &'b i32), 依此类推。

<!---->
2. **若只有一个输入生命周期(函数参数中只有一个引用类型)，那么该生命周期会被赋给所有的输出生命周期**，也就是所有返回值的生命周期都等于该输入生命周期
   
   例如函数 fn foo(x: &i32) -> &i32，x 参数的生命周期会被自动赋给返回值 &i32，因此该函数等同于 fn foo<'a>(x: &'a i32) -> &'a i32
<!---->
3. **若存在多个输入生命周期，且其中一个是 &self 或 &mut self，则 &self 的生命周期被赋给所有的输出生命周期**
   拥有 &self 形式的参数，说明该函数是一个 方法，该规则让方法的使用便利度大幅提升。

## 方法中的生命周期

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
}
```

其中有几点需要注意的：

- impl 中必须使用结构体的完整名称，包括 <'a>，因为生命周期标注也是结构体类型的一部分！
- 方法签名中，往往不需要标注生命周期，得益于生命周期消除的第一和第三规则



`&self` 生命周期是 `'a`，那么 `self.part` 的生命周期也是 `'a`，但是好巧不巧的是，我们手动为返回值 `self.part` 标注了生命周期 `'b`，因此编译器需要知道 `'a` 和 `'b` 的关系,

```rust
/// Error
impl<'a> ImportantExcerpt<'a> {
                                                        // 定义了返回值生命周期是'b
    fn announce_and_return_part<'b>(&'a self, announcement: &'b str) -> &'b str {
        println!("Attention please: {}", announcement);
        self.part  // 返回值self.part 应该被 self `a 的生命周期覆盖
    }
}

/// Fix
impl<'a: 'b, 'b> ImportantExcerpt<'a> {
    fn announce_and_return_part(&'a self, announcement: &'b str) -> &'b str {
        println!("Attention please: {}", announcement);
        self.part
    }
}
```
- `'a: 'b`，是生命周期约束语法，跟泛型约束非常相似，用于说明 `'a` 必须比 `'b` 活得久
- 可以把 `'a` 和 `'b` 都在同一个地方声明（如上），或者分开声明但通过 `where 'a: 'b` 约束生命周期关系，如下：


## 静态生命周期
Rust 中有一个非常特殊的生命周期，那就是 'static，拥有该生命周期的引用可以和整个程序活得一样久。

字符串字面量，提到过它是被硬编码进 Rust 的二进制文件中，因此这些字符串变量全部具有 `'static` 的生命周期：

- 生命周期 `'static` 意味着能和程序活得一样久，例如字符串字面量和特征对象
- 实在遇到解决不了的生命周期标注问题，可以尝试 `T: 'static`，有时候它会给你奇迹