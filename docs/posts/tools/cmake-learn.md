---
title: CMake的简单学习
lang: zh-CN
tags:
  - Tools
date: 2021-09-17
---

## Cmake Basic

### 变量

Cmka中的所有变量都是 string ，使用 `${变量}`

可以使用 `set()` 以及`unset()`来声明或者移除一个变量

<!-- more -->

```cmake
# 创建一个变量
set(var_name 1234567)
# 打印
message("var : ${var_name}")

# 创建一个列表
set(list_test Python Java CPP Dart)
# 打印
message("list : ${list_test}")
```

### 操作符

| 类型  | 名称                                                    |
| --- | ----------------------------------------------------- |
| 一元  | EXIST,COMMAND,DEFINED                                 |
| 二元  | EQUAL,LESS,LESS_EQUAL,GREATER(大于),GREATER_EQUAL ..... |
| 逻辑  | NOT,AND,OR                                            |

优先级：

（）  >   一元  > 二元  >  逻辑

### 布尔常量值

| 类型    | 值                                                         |
| ----- | --------------------------------------------------------- |
| true  | 1,ON,YES,TRUE,Y,非零值                                       |
| false | 0,OFF,NO,FALSE,N,IGNORE,NOTFOUND,空字符串，以 `-NOTFOUND`结尾的字符串 |

### 条件语句

```cmake
if (表达式)
    COMMAND(ARGS)    
elseif (表达式)     
    COMMAND(ARGS)
else (表达式)
    COMMAND(ARGS)
endif (表达式)    
```

### 循环语句

#### while

```cmake
while (表达式)
    COMMAND(ARGS)

    continue() #跳出本次循环
    break() #可以跳出整个循环
endwhile(表达式)
```

#### foreach

```cmake
foreach (item 1 2 3)
    COMMAND(ARGS)

    continue() #跳出本次循环
    break() #可以跳出整个循环
endforeach(item)    

OR

foreach (item RANG ${END})
    COMMAND(ARGS)

    continue() #跳出本次循环
    break() #可以跳出整个循环
endforeach(item)

OR

foreach (item RANG ${START} ${END} ${STEP})
    COMMAND(ARGS)

    continue() #跳出本次循环
    break() #可以跳出整个循环
endforeach(item)
```

### 函数

```cmake
function (<func_name> [arg1] [arg2] ... [argN])
    COMMAND()
endfunction(<func_name>)    

# 调用
func_name(args...)
```

## Cmake Command

### 指定版本

`cmake_minimun_required(VERSION 3.10.1)`

指定Cmake最低支持的版本号

### 源文件查找

`aux_source_directory({目录} DIR_LIST)`

- 查找指定目录的源文件列表，并把这个列表保存到指定变量`DIR_LIST`
- 只能查找当前目录下的文件，不会对子目录起作用

```cmake
aux_source_directory(src SRC_DIR)
aux_source_directory(src/advance SRC_ADVANCE)
aux_source_directory(src/basic SRC_BASIC)
```

### 添加库

##### 添加一个库

`add_library(<name> [STATIC | SHARED | MODULE] [EXCLUDE_FROM_ALL] source1 ...)`

- 添加一个库，名字是  <name>
- 指定库的类型
  - STACIC 静态库
  - SHARED 动态库
  - MODULE 如果支持`dyld`有效，否则等同 SHARED
- EXCLUDE_FROM_ALL  表示这个库不会被默认构建
- source1 ... sourceN   指定库的源文件

##### 导入预编译库

`add_library(<name> [STATIC | SHARED | MODULE] IMPORTED)`

- 添加一个已经编译好的库，名字为 <name>
- 一般配合`set_target_properties`使用

```cmake
add_library(test SHARED IMPORTED)

set_target_properties(
        test  #库名字
        PROPERTIES IMPORT_LOCATION  #指明设置的参数
        ${库路径}/libtest.so    #导入库的路径
)
```

#### 常用的参数

##### 设置可执行文件的输出路径

`EXECUTABLE_OUTPUT_PATH`全局变量

```cmake
set(EXECUTABLE_OUTPUT_PATH ${CMAKE_SOURCE_DIR}/build)
```

##### 设置库文件的输出目录

`LIBRARY_OUTPUT_PATH` 全局变量

```cmake
set(LIBRARY_OUTPUT_PATH ${路径})
```

##### 设置编译参数

`CMAKE_CXX_FLAGS`全局变量

```cmake
# 允许c++11标准、O3优化、多线程。match选项可避免一些cpu上的问题
set( CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14 -march=native -O3 -pthread" )
```

##### 设置源文件集合

`SOURCE_FILES` 本地自定义变量

```cmake
set(SOURCE_FILES mian.cpp ...)
```

### 设置头文件

```cma
set(INCLUDES  includes/advance/ includes/basic/  )
include_directories(${INCLUDES})
```

可以使用相对/绝对路径

### 添加可执行文件

`add_executable(<name> ${SRC_LIST})`

```cmake
# Set all source
set(ALL_SOURCE ${SRC_DIR} ${SRC_ADVANCE} ${SRC_BASIC})
add_executable(learn_cpp ${ALL_SOURCE})
```

### 链接多个库

`target_link_libraries(<name> lib1 ... libN)`

- 将一个或者多个库链接到目标库文件
- 必须按照互相的依赖关系  lib1 -> lib_sub_1 -> lib_sbu_1_sub_1

```cmake
# Link dirs
set(LIBRARIES ${EVENT_LIBRARIES})
target_link_libraries(learn_cpp  ${LIBRARIES})
```

### 添加子目录可执行文件

`add_subdirectory(sub_dir [binary_dir])`

> sub_dir 指的是包含CMakeList.txt 和源文件的子目录地址
> 
> binary_dir  是输出路径，一般不指定

需要包含CMakeList.txt