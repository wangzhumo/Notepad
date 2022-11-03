---
title: Android启动时间优化
lang: zh-CN
tags:
  - Android
date: 2021-09-17
---

## 前言

App的启动时间从2s飙升到了5s，已经明显的感知到启动慢。

提测后的我准备对启动时间进行优化，打算使用 systrace 进行分析

> [系统跟踪概览  | Android 开发者  | Android Developers (google.cn)](https://developer.android.google.cn/topic/performance/tracing)

本来使用Android Studio自带的工具是最好的，但是尝试多次它都没有办法从App启动开始录制Trace文件，只能选择自己动手了

- Systrace 命令行工具
- Perfetto 命令行工具

这里我选择[Perfetto](https://perfetto.dev/)进行分析，使用Systrace抓取。

<!-- more -->


## 基础知识

Systrace的相关知识可以看这位大佬的文章 

> [Android Systrace 基础知识 -- Systrace 简介 · Android Performance](https://www.androidperformance.com/2019/05/28/Android-Systrace-About/)

基本的操作可以从google develper 网站了解到

> [浏览 Systrace 报告  | Android 开发者  | Android Developers (google.cn)](https://developer.android.google.cn/topic/performance/tracing/navigate-report)

如果使用老版本的Systrace来查看的话，一定要先看看google的这个文档，要不然可能连看都没办法看，主要是了解一下 [快捷键](https://developer.android.google.cn/topic/performance/tracing/navigate-report#keyboard-shortcuts)

## 抓取Trace文件

### 一.通过Perfetto抓取

> [Quickstart: Record traces on Android - Perfetto Tracing Docs](https://perfetto.dev/docs/quickstart/android-tracing)

#### 1.通过[Perfetto UI](https://ui.perfetto.dev/#!/)的图形界面

图形界面进行抓取，我的测试机不支持，只能通过命令

#### 2.通过命令进行抓取

**2.1打开perfetto services**

```shell
# Will start both traced and traced_probes.
adb shell setprop persist.traced.enable 1
```

**2.2写入配置文件**

config.txt (这是我自己的配置文件，可以参考)

```json
// 抓取的时间
duration_ms: 10000

buffers: {
    size_kb: 8960
    fill_policy: DISCARD
}
buffers: {
    size_kb: 1280
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "sched/sched_switch"
            ftrace_events: "power/suspend_resume"
            ftrace_events: "sched/sched_process_exit"
            ftrace_events: "sched/sched_process_free"
            ftrace_events: "task/task_newtask"
            ftrace_events: "task/task_rename"
            ftrace_events: "ftrace/print"
            atrace_categories: "gfx"
            atrace_categories: "view"
            atrace_categories: "webview"
            //这里填入自己的包名
                      atrace_apps: "xxxxxxxx"
        }
    }
}
data_sources: {
    config {
        name: "linux.process_stats"
        target_buffer: 1
        process_stats_config {
            scan_all_processes_on_start: true
        }
    }
}
```

把这个配置文件写入你要抓取的手机

```shell
adb push config.txt /data/local/tmp/trace_config.txt
```

##### 2.3开始抓取

```shell
adb shell 'cat /data/local/tmp/trace_config.txt | perfetto --txt -c - -o /data/misc/perfetto-traces/trace'

# 输出
perfetto_cmd.cc:604      Connected to the Perfetto traced service, starting tracing for 10000 ms
# /data/misc/perfetto-traces/trace 这个就是抓到的trace文件
perfetto_cmd.cc:677      Wrote 9206246 bytes into /data/misc/perfetto-traces/trace
```

这里的trace文件是perfetto格式的，如果你需要通过Systrace打开的话，需要转一下

```shell
curl -LO https://get.perfetto.dev/traceconv
chmod +x traceconv
./traceconv [text|json|systrace|profile] [input proto file] [output file]

# Converting to systrace text format
./traceconv systrace [input proto file] [output systrace file]

# Converting to Chrome Tracing JSON format
./traceconv json [input proto file] [output json file]
```

不过我更加推荐直接使用perfetto UI 打开，然后 `Legacy UI` 打开，会自动转

### 二.通过Systrace抓取

这里的话，我也是直接使用提供的命令去抓取了，Android高版本应该会有`系统追踪`功能，不过我没有去看

#### 1.前置

**1.1需要SDK支持**

先跳转到`Android/sdk/platform-tools/systrace`

**1.2Python版本**

这个脚本只支持python2的版本，所以记得切python的版本，要不会失败

#### 2.抓取

```shell
python ./systrace.py -t 5 sched gfx view wm am app webview  -a io.xxxx.xxxx -o ~/Downloads/inyuapptrace/trace.html

# 输入
These categories are unavailable: app
Starting tracing (5 seconds)

#看到 Starting tracing 的时候，就可以点开app了
Starting tracing (5 seconds)
Tracing completed. Collecting output...
Outputting Systrace results...
Tracing complete, writing results

# 这个是输出目录
Wrote trace HTML file: file:///Users/wangzhumo/Downloads/inyuapptrace/trace.html
```

- -t：抓取的时间
- shced：cpu调度
- gfx：图形信息
- view：视图
- wm：窗口管理
- am：活动管理
- app：应用信息
- webview：webview信息
- -a：指定目标的包名
- -o：生成的systrace.html输入位置

其他的使用 `python systrace.py -l`可以查看

## 查看Trace文件

上面的两种文件我们都可以通过[Perfetto UI](https://ui.perfetto.dev/)打开

我自己只熟悉Systrace的视图，就直接使用 `Open Wiht legacy UI`来查看了

嗯 ~~~~ 然后我发现虽然能发现问题，但是还不够清晰

![trace_223_systrace](https://image.wangzhumo.com/2021/09/trace_223_systrace.png)

虽然能知道bindApplication 以及 开屏的 measure卡，但是我仍然不知道具体的类，方法，还是需要自己的找

所以我们还需要自己去加一些tag，方便我们定位问题

**ByteX 墙裂安利**

[bytedance/ByteX: ByteX is a bytecode plugin platform based on Android Gradle Transform API and ASM. 字节码插件开发平台 (github.com)](https://github.com/bytedance/ByteX)

使用`byteX`把tag注入到方法中去，我写了一个插件，并提供的两个默认实现

- SystraceTraceImpl          注入tag

- MethodTimeTraceImpl  统计方法耗时

这里就不详细说这个了，我们看看加了tag后的Systrace图

![trace_223_plugin_01](https://image.wangzhumo.com/2021/09/trace_223_plugin_01.png)

![trace_223_plugin_02](https://image.wangzhumo.com/2021/09/trace_223_plugin_02.png)

这样的话，我们就可以针对每一个方法去搞定它的耗时操作了，进而优化启动的时间

## 优化的思路

对于优化的话，在我看来就2条路

1.异步执行

2.提前准备资源

#### Application

**对于这次的问题来说，Application中的话，我会把一些耗时的操作移动到IntentService或者是等待页面展示出来后再进行初始化**

#### Activity

- 布局进行优化
  - ViewPager替换为 loadMultiRootView
  - 延迟显示不太重要的元素
  - 有些View是可以固定宽高的，写上值避免它多次measure
- 动态的添加移除
  - 我发现有一些View,有可能根本就不会显示出来，但是之前的实现是 GONE 掉的
  - 重复的移除老代码
- 移除老逻辑，减少判断

在此次优化完毕之后，经过测试

```
#优化前
➜ adb shell am start -W -n io.xxxx.xxxx/io.xxxx.xxxx.main.MainActivity
Starting: Intent { cmp=io.xxxx.xxxx/.main.MainActivity }
Status: ok
LaunchState: COLD
Activity: io.xxxx.xxxx/.main.MainActivity
TotalTime: 4341
WaitTime: 4350
Complete


#优化后
➜ adb shell am start -W -n io.xxxx.xxxx/io.xxxx.xxxx.main.MainActivity
Starting: Intent { cmp=io.liuliu.xxxx/.main.MainActivity }
Status: ok
LaunchState: COLD
Activity: io.xxxx.xxxx/.main.MainActivity
TotalTime: 2229
WaitTime: 2241
Complete
```

实际上，如果是release包的话，会更快一下，因为这其中还带了两个个网络请求，debug环境下400ms 正式的100ms
