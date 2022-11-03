---
title: 线程与进程的异同以及Android中的IPC机制
lang: zh-CN
tags:
  - Android
date: 2021-10-21  
---

### 线程与进程

[Android Developers#processes-and-threads](https://developer.android.com/guide/components/processes-and-threads)

- 进程是资源分配的最小单位，线程是cpu调度的最小单位.

进程是应用程序的执行实例,一个进程中可以包含多个线程,

而一个进程的创建分配是要消耗较大的性能的,相比来说线程就要比进程的开销小.

- 对于进程来说不共享资源,内存是独立的.而线程共享它所在的线程的资源,内存.

进程间的通信就要更加麻烦,需要使用IPC( Inter-Proscess Communication)进程间的通讯

线程方便很多,但是线程间的同步又是一个较为大的课题了.

<!-- more -->

> 想强调的是，线程关注的是中央处理器的运行，而不是进程那样关注内存等资源的管理。

### Android中的IPC机制

如下图所示:(已经不知道哪里的配图了…感谢分享)

![android_ipc](https://image.wangzhumo.com/2021/09/android_ipc.png)

### IPC简介

IPC(Inter-Process Communication) 进程间通信

使用场景:

在Android程序中，一般情况下一个程序就是一个进程

1. App间的通信,常见的如需要使用其他App的数据

一个App使用多进程,比如指定运行线程`android:process=":name"`

> 需要注意的是,如果一个App使用多进程,Application也会多次创建

### Bundle

常见于Activity,service中传递数据

需要注意的是,bundle中的数据必须支持序列化(Serializable,Parcelable)

### 文件共享

SharedPreference就是这种实现的.

适合对同步要求不高的使用方式,需要注意处理好并发的问题.

### Messenger

Messenger 对 AIDL 进行了封装，它实现了一种基于消息的进程间通信的方式

`frameworks/base/core/java/android/os/IMessenger.aidl`

它的AIDL文件就在这里保存着!

### AIDL

AIDL（Android Interface definition language） 是 Android 提供的一种进程间通信 (IPC) 机制

需要注意的是AIDL支持的数据类型与Java接口支持的数据类型有些不同:

1. 所有基础类型（int, char...）
2. String，List，Map
3. 所有Parcelable的类

并且要根据需要添加 in out 的关键词

### ContentProvider

主要是针对数据库使用的,最常见的例子就是Android中有很多已经定义好的ContentProvider
