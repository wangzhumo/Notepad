---
title: Python初识
lang: zh-CN
tags:
  - Protocal
  - Python
date: 2020-01-23  
---


## 基础知识
**数据类型**

- Numbers(数字)
  - int (有符号整形)
  - long(长整形)
  - float(浮点型)
  - complex(复数)

<!-- more -->

- 布尔型

- String

- List(列表)

- Tuple(元组)

- Dictionary(字典)


**变量的命名规则**

a-z A-Z , 0-9,下划线,并且数字不能开头

ps:区分大小写


**逻辑运算符**

- and   

   eg : if age >=15 and age <=20 
- or

  eg : 同上
- not

  if not age == 15

**if语句**

- if
- if else
- if elif ... elif



下面是完整的，它可以与％符号使用列表:

**格式符号转换**

```
%c	字符
%s	通过str() 字符串转换来格式化
%i	有符号十进制整数
%d	有符号十进制整数
%u	无符号十进制整数
%o	八进制整数
%x	十六进制整数（小写字母）
%X	十六进制整数（大写字母）
%e	索引符号（小写'e'）
%E	索引符号（大写“E”）
%f	浮点实数
%g	％f和％e 的简写
%G	％f和％E的简写
```

**字符串操作**

- find("aafasdf")      找到返回index   没有则 -1
- index("aa")          找到返回index   没有则 异常
- count("aa")          字符串里共有几个 a 
- len("strings ")      字符串个数大小

- replace()            替换
把 mystr 中的 str1 替换成 str2,如果 count 指定，则替换不超过 count 次.

- split()              分割
  以 str 为分隔符切片 mystr，如果 maxsplit有指定值，则仅分隔 maxsplit 个子字符串
  mystr.split(str=" ", 2)    
- capitalize()         把字符串的第一个字符大写
- startswith           
 检查字符串是否是以 obj 开头, 是则返回 True，否则返回 False

- endswith
检查字符串是否以obj结束，如果是返回True,否则返回 False.

- lower    mystr.lower()   
转换 mystr 中所有大写字符为小写   

- upper    mystr.upper()
转换 mystr 中的小写字母为大写

- ljust
返回一个原字符串左对齐,并使用空格填充至长度 width 的新字符串

- rjust   mystr.rjust(width)    
返回一个原字符串右对齐,并使用空格填充至长度 width 的新字符串

- center    mystr.center(width)   
  返回一个原字符串居中,并使用空格填充至长度 width 的新字符串
  
- lstrip   删除 mystr 左边的空格

- rstrip   删除 mystr 字符串末尾的空格

- rfind    类似于 find()函数，不过是从右边开始查找.
- rindex   类似于 index()，不过是从右边开始.

- partition       #mystr.partition(str)
把mystr以str分割成三部分,str前，str和str后

- rpartition
类似于 partition()函数,不过是从右边开始.
- splitlines  
按照行分隔，返回一个包含各行作为元素的列表
- isalnum    
如果 mystr 所有字符都是字母或数字则返回 True,否则返回 False
- isalpha
如果 mystr 所有字符都是字母 则返回 True,否则返回 False
- isdigit
如果 mystr 只包含数字则返回 True 否则返回 False.
- isspace  如果 mystr 中只包含空格，则返回 True，否则返回 False.
- isupper
如果 mystr 所有字符都是大写，则返回 True，否则返回 False
- join     mystr.join(str)
mystr 中每个字符后面插入str,构造出一个新的字符串


**List的操作**
list = ["d","asdf",23423]

len(list)
list.append()

- 删除

del   根据下标删除
pop   移除最后一个
remove    

- 查找

name  in  nmaes



**递归**

```

def add(n):
    if n > 1:
        result = n * add(n-1)
    else:
        result = 1
    return result

//当走到else 时不再递归调用,return 的值是到了倒数第二次的递归调用,然后一直往回去走



print(add(4))
```


## 基础数据类型
**1.整数**


**2.浮点数**

浮点数也就是小数

整数运算永远是精确的（除法难道也是精确的？是的！），而浮点数运算则可能会有四舍五入的误差。



**3.字符串**

以单引号`'`或双引号`"`括起来的任意文本

包含`'`又包含`"`

```python
//用转义字符\来标识

'It\'s \"OK\"!'
```



**4.布尔值**

布尔值只有`True`、`False`两种值

布尔值可以用`and`、`or`和`not`运算

```
and运算是与运算
not运算是非运算
not运算是非运算，它是一个单目运算符，把True变成False
```



**5.空值**

空值是Python里一个特殊的值，用`None`表示



**6.变量**

变量名必须是大小写英文、数字和`_`的组合，且不能用数字开头

等号`=`是赋值语句

> 可以把任意数据类型赋值给变量，同一个变量可以反复赋值，而且可以是不同类型的变量

注意,并不是像Java一样,变量b接受的是'123' 而不是a的引用地址

```python
>>> a = '123'
>>> b = a
>>> a = 456
>>> print(a)
456
>>> print(b)
123
```



**7.常量**

通常用全部大写的变量名表示常量

但事实上仍然是一个变量，Python根本没有任何机制保证不会被改变





```python
/除法计算结果是浮点数，即使是两个整数恰好整除，结果也是浮点数

>>> 10 / 3
3.3333333333333335


还有一种除法是//，称为地板除，两个整数的除法仍然是整数
>>> 10 // 3
3
```

## 字符串

> 最新的Python 3版本中，字符串是以Unicode编码的，也就是说，Python的字符串支持多语言



**单个字符的编码**，Python提供了`ord()`函数获取字符的整数表示，`chr()`函数把编码转换为对应的字符

```python
>>> ord('A')
65
>>> ord('中')
20013
>>> chr(66)
'B'
>>> chr(25991)
'文'
```





**Python的字符串类型是`str`**，在内存中以Unicode表示，一个字符对应若干个字节。如果要在网络上传输，或者保存到磁盘上，就需要把`str`变为以字节为单位的`bytes`



**bytes**

*Python对`bytes`类型的数据用带`b`前缀的单引号或双引号表示*

```python
x = b'ABC'
```

`'ABC'`和`b'ABC'`，前者是`str`，后者虽然内容显示得和前者一样，但`bytes`的每个字符都只占用一个字节



**str转bytes**

Unicode表示的`str`通过`encode()`方法可以编码为指定的`bytes`



```python
>>> 'ABC'.encode('ascii')
b'ABC'
>>> '中文'.encode('utf-8')
b'\xe4\xb8\xad\xe6\x96\x87'
```



**bytes转str**

读到的数据就是`bytes`。要把`bytes`变为`str`，就需要用`decode()`方法

```
>>> b'ABC'.decode('ascii')
'ABC'
>>> b'\xe4\xb8\xad\xe6\x96\x87'.decode('utf-8')
'中文'
```



**字符串的格式化**

常见的占位符有：

| %d   | 整数     |
| ---- | ------ |
| %f   | 浮点数    |
| %s   | 字符串    |
| %x   | 十六进制整数 |



有几个`%?`占位符，后面就跟几个变量或者值，顺序要对应好。如果只有一个`%?`，括号可以省略

```python
>>> 'Hello, %s' % 'world'
'Hello, world'
>>> 'Hi, %s, you have $%d.' % ('Michael', 1000000)
'Hi, Michael, you have $1000000.'
```



小数位数的格式化

格式化整数和浮点数还可以指定是否补0和整数与小数的位数：

```python
>>> '%2d-%02d' % (3, 1)
' 3-01'
>>> '%.2f' % 3.1415926
'3.14'
```



如果你不太确定应该用什么，`%s`永远起作用，它会把任何数据类型转换为字符串

```python
>>> 'Age: %s. Gender: %s' % (25, True)
'Age: 25. Gender: True'
```



字符串里面的`%`是一个普通字符怎么办？这个时候就需要转义，用`%%`来表示一个`%`

```python
>>> 'growth rate: %d %%' % 7
'growth rate: 7 %'
```



**python源码文件**

```
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
```

第一行注释是为了告诉Linux/OS X系统，这是一个Python可执行程序，Windows系统会忽略这个注释；

第二行注释是为了告诉Python解释器，按照UTF-8编码读取源代码，否则，你在源代码中写的中文输出可能会有乱码。

## list和tuple
**list**是一种有序的集合，可以随时添加和删除其中的元素.

**tuple**和list非常类似，但是tuple一旦初始化就不能修改.

```python
>>> list = ['Lili',"Mike","王诛魔"]
>>> print(list)
['Lili', 'Mike', '王诛魔']
```



**list的一些操作**

- 长度 len(list)

  ```
  >>>len(list)
  3
  ```

- 取出元素

  ```
  >>>list[0]
  'Lili'
  ```

  index也可以是负数,就是从最后开始计算

  ```
  >>>list[-1]
  '王诛魔'
  ```


- 添加元素

  赋值替换

  ```python
  >>> list[0]= "Mraker"
  >>> list
  ['Mraker', 'Mike', '王诛魔']
  ```

  

  插入末尾

  ```
  >>>list.append("Ada")
  ['Lili', 'Mike', '王诛魔', 'Ada']
  ```

  插入指定位置

  ```
  >>>list.insert(1,'Jack')
  ['Lili', 'Jack', 'Mike', '王诛魔', 'Ada']
  ```


- 删除元素

  删除list末尾的元素，用`pop()`方法：

  ```
  >>> list.pop()
  'Ada'
  ```

  删除指定位置的元素，用`pop(i)`方法

  ```
  >>> list.pop(1)
  'Jack'
  ```

**list里面的元素的数据类型也可以不同**

```python
>>> list
['Mraker', 'Mike', '王诛魔']
>>> list2 = [123,'Abc',True,list]
>>> len(list2)
4
>>> list2
[123, 'Abc', True, ['Mraker', 'Mike', '王诛魔']]
```





**tuple**

```
tuples = ('Michael', 'Bob', 'Tracy')
t = ('a', 'b', ['A', 'B'])
```





#### 高级操作

**切片**

```python
L = ['Michael', 'Sarah', 'Tracy', 'Bob', 'Jack']

>>> L[0:3]
['Michael', 'Sarah', 'Tracy']

>>> L[-3:-1]
['Tracy', 'Bob']
```



`L[0:3]`表示，从索引`0`开始取，直到索引`3`为止，但不包括索引`3`,,如果第一个索引是`0`，可以省略



**迭代**

如果要迭代value，可以用`for value in d.values()`，

如果要同时迭代key和value，可以用`for k, v in d.items()`。



Python内置的`enumerate`函数可以把一个list变成索引-元素对

```
>>> for i, value in enumerate(['A', 'B', 'C']):
...     print(i, value)
...
0 A
1 B
2 C
```



同时引用了两个变量

```
>>> for x, y in [(1, 1), (2, 4), (3, 9)]:
...     print(x, y)
...
1 1
2 4
3 9
```



**列表生成器**

列表生成式即List Comprehensions，是Python内置的用来创建list的生成式。

```
>>> [x * x for x in range(1, 11) if x % 2 == 0]
[4, 16, 36, 64, 100]
```

```
L1 = ['Hello', 'World', 18, 'Apple', None]
L2 = [ value.lower() for value in L1 if isinstance(value,str)]
print(L2)

输出: ['hello', 'world', 'apple']
```

其中`if isinstance(value,str)`表示取出满足条件的`value`
for语句前的`value.lower()`,表示对取出的每一个值进行lower()的操作,然后放入新的list中


**生成器**
一边循环一边计算的机制.称为生成器：generator。

- 可以通过next()函数获得generator的下一个返回值

```
g = (x * x for x in range(10))

>>> next(g)
0
>>> next(g)
1
>>> next(g)
4
```

- 使用for循环

```
>>> g = (x * x for x in range(10))
>>> for n in g:
...     print(n)
... 
0
1
4
```

## IF和for
**条件判断**

```python
age = 3
if age >= 18:
    print('your age is', age)
    print('adult')
else:
    print('your age is', age)
    print('teenager')
```

`elif`是`else if`的缩写

```python
if <条件判断1>:
    <执行1>
elif <条件判断2>:
    <执行2>
elif <条件判断3>:
    <执行3>
else:
    <执行4>
```



`if`判断条件还可以简写，比如：

```
//只要x是非零数值、非空字符串、非空list等，就判断为True，否则为False
if x:
    print('True')
```





**For循环**

`for x in ...`循环就是把每个元素代入变量`x`

```python
names = ['Michael', 'Bob', 'Tracy']
for name in names:
    print(name)
```



`range()`函数，可以生成一个整数序列

```
>>> list(range(5))
[0, 1, 2, 3, 4]
```



**while循环**

只要条件满足，就不断循环

```
while n > 0:
    sum = sum + n
    n = n - 2
```

## 函数
**默认参数**

power(1,2)

power(1)

都可以调用成功,其中n=2为默认参数

    def power(x, n=2):
    s = 1
    while n > 0:
        n = n - 1
        s = s * x
    return s
PS;默认参数必须指向不变对象,如果为可变参数,则每次调用,使用到默认参数时都会改变默认参数的值



**可变参数(**参数前面加了一个`*`号**)**

参数`numbers`接收到的是一个tuple

```
def calc(*numbers):
    sum = 0
    for n in numbers:
        sum = sum + n * n
    return sum
```



Python允许你在list或tuple前面加一个`*`号，把list或tuple的元素变成可变参数传进去

```
list=['a','b','c']
calc(list[0],list[1],list[2])

> 可以写成
calc(*list)
```

**定义函数**

使用`def`语句，依次写出函数名、括号、括号中的参数和冒号`:`，然后，在缩进块中编写函数体，函数的返回值用`return`语句返回



如果没有`return`语句，函数执行完毕后也会返回结果，只是结果为`None`