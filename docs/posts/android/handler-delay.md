---
title: Handler-是如何实现延迟消息的
lang: zh-CN
tags:
  - Android
  - Handler
date: 2021-09-23
---

## 前言
对于这个问题的探讨，需要一些前置的知识点
> android-handler-base1

Handler中
post 发送Message
send 发送Message

最终都会走到MessageQueue
`boolean enqueueMessage(MessageQueue queue, Message msg, long uptimeMillis)`

接下来我们从`postDelayed(@NonNull Runnable r, long delayMillis)`开始探讨怎么实现的延迟？

<!-- more -->

## 调用流程

![handle_message_send_delay](https://image.wangzhumo.com/2021/09/handle_message_send_delay.png)

需要重点关注的就是next方法：

```java
Message next() {
    // 0.初始值是0
    int nextPollTimeoutMillis = 0;
    for (;;) {
        // 1.这里就是实现Looper中阻塞以及 Handler延迟的关键
        nativePollOnce(ptr, nextPollTimeoutMillis);
    
        synchronized (this) {
            // 2.获取当前的时间
            final long now = SystemClock.uptimeMillis();
            Message prevMsg = null;
            Message msg = mMessages;
            // 3.如果当前的消息是同步屏障消息，那么找到异步消息
            if (msg != null && msg.target == null) {
                do {
                    prevMsg = msg;
                    msg = msg.next;
                } while (msg != null && !msg.isAsynchronous());
            }
            // 4.如果上面流程之后，msg有值
            if (msg != null) {
                // 4.1 如果现在时间小于这个消息希望执行的时间
                // 把需要等待的时间赋值给nextPollTimeoutMillis
                if (now < msg.when) {
                    nextPollTimeoutMillis = (int) Math.min(msg.when - now, Integer.MAX_VALUE);
                } else {
                    // 4.2 这里说明当前的Msg需要立即去执行.
                    mBlocked = false;
                    if (prevMsg != null) {
                        // 4.3 说明有同步屏障,那么这里的msg中存的就是一个异步消息
                        // 那么我们要做的是，把当前的这个消息从消息队列移除
                        // prevMsg.next = msg.next 移除这一条消息
                        prevMsg.next = msg.next;
                    } else {
                        // 4.4 这是一个同步消息，直接执行即可
                        // 同时，直接移除自己即可
                        mMessages = msg.next;
                    }
                    msg.next = null;
                    msg.markInUse();
                    //5.这里是for(;;)中除退出之外唯一的出口
                    return msg;
                }
            } else {
                // 6.没有消息了，一直等待即可
                nextPollTimeoutMillis = -1;
            }
        }
    }
}
```

通过注释我们大概能了解`next()`的逻辑，`next`内一直循环，直到无法取出消息为止
总的来说：

![handler_message_next_loop](https://image.wangzhumo.com/2021/09/handler_message_next_loop.png)

### nextPollTimeoutMillis

#### 赋值情况
我们观察`nextPollTimeoutMillis`,分别在`0`,`4.1`,`6` 的注释处被赋值，它的值大致可以被分为三类：
1. `0 零值`且只会在进入循环之前被赋值为0
2. `>0 大于零`一般就是没有到一个消息要执行的时候会被赋值为需要等待的时间差
3. `-1 负值`没有消息时被赋值为-1

#### 调用情况
1. android_os_MessageQueue.cpp
```cpp
android_os_MessageQueue_nativePollOnce(JNIEnv* env, jobject obj,
    jlong ptr, jint timeoutMillis)
    
    
    
void NativeMessageQueue::pollOnce(JNIEnv* env, jobject pollObj, int timeoutMillis) {
    //...
    mLooper->pollOnce(timeoutMillis);
    // ...
}  
```


2. system/core/libutils/include/utils/Looper.h
```cpp
inline int pollOnce(int timeoutMillis) {
    return pollOnce(timeoutMillis, nullptr, nullptr, nullptr);
}
```

3. system/core/libutils/Looper.cpp
```cpp
int Looper::pollOnce(int timeoutMillis, int* outFd, int* outEvents, void** outData) {
    int result = 0;
    for (;;) {
        // ...
        result = pollInner(timeoutMillis);
    }
}


int Looper::pollInner(int timeoutMillis){
    //...
    int eventCount = epoll_wait(mEpollFd.get(), eventItems, EPOLL_MAX_EVENTS, timeoutMillis);
    //...
}
```

可以看到，最后调用到了`epoll_wait`这里，其中参数`timeoutMillis`就是我们在Java层的`nextPollTimeoutMillis`

**epoll_wait**
```cpp
int epoll_wait(int epfd, struct epoll_event *events,int maxevents, int timeout);
```

其中参数timeout
* timeout > 0 则最多等待 timeoutMillis
    * 一个文件描述符触发事件
    * 被一个信号处理函数打断，或者timeout超时
* timeout = 0 就算没有任何事件，也会立刻返回
* timeout < 0 无限等待


## 总结
1. 发送一个延迟消息到MessageQueue
2. MessageQueue将消息加入队列，而后进行排序
3. Looper.loop()会不停的调用MessageQueue.next()方法
4. MessageQueue.next()中的`for(;;)`会取消息给Looper.loop()
5. (略过同步屏障)Message.next()中获取一个可用的Message
6. Message.next()获取到消息会对比`when`字段，如果是延迟消息，不会把它从消息队列中移除，会记录要延迟的时间，发送到`nativePollOnce`
7. NativeMessageQueue中会走`epoll_wait`,等到需要延迟的时间后，如果是阻塞状态会自己唤醒，如果不是那就在`Message.next`中会被返回给Looper.loop()中，从而继续执行
