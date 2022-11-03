---
title: Handler-到底是如何跨线程的
lang: zh-CN
tags:
  - Android
  - Handler
date: 2021-09-23
---

![multi_thread_handler](https://image.wangzhumo.com/2021/09/multi_thread_handler.png)

嗯？怎么说这个问题那？可能是一叶障目的那种感觉，其实问题的答案很明确，只是自己有点绕进去。

<!-- more -->

## 提出问题
1. 每一个线程内部都会有一个Looper + MessageQueue,那他们只会在自己的线程跑，为什么能够跨线程那？
2. 我们类比Binder,它是通过mmap做到的跨进程，那么Handler是什么？
3. 每一个线程的消息队列都是独立的，也没有什么转发，怎么做到的？


## 梳理发送路径

### 1.Handler-send

```java
private boolean enqueueMessage(@NonNull MessageQueue queue, @NonNull Message msg,long uptimeMillis) {
    msg.target = this;
    msg.workSourceUid = ThreadLocalWorkSource.getUid();

    if (mAsynchronous) {
        msg.setAsynchronous(true);
    }
    return queue.enqueueMessage(msg, uptimeMillis);
}
```

Handler没有做什么东西，只是添加了是否异步消息，并发送给MessageQueue

## 2.MessageQueue
```java
boolean enqueueMessage(Message msg, long when) {
    synchronized (this) {
        // 设置Message的属性
        msg.markInUse();  //设置正在使用中
        msg.when = when;  //增加时间顺序，后续队列中排序
        Message p = mMessages;
        boolean needWake; //是否需要唤醒线程
        if (p == null || when == 0 || when < p.when) {
            // 插队到第一个
            msg.next = p;
            mMessages = msg;
            needWake = mBlocked;
        } else {
            // 重新给Message的消息队列排序，按时间顺序插入到队列
            needWake = mBlocked && p.target == null && msg.isAsynchronous();
            Message prev;
            for (;;) {
                prev = p;
                p = p.next;
                if (p == null || when < p.when) {
                    break;
                }
                if (needWake && p.isAsynchronous()) {
                    needWake = false;
                }
            }
            msg.next = p; 
            prev.next = msg;
        }

        if (needWake) {
            // 唤起
            nativeWake(mPtr);
        }
    }
    return true;
}
```
MessageQueue#enqueueMessage 干了什么？做了排序
以及提供了MessageQueue#next()方法，挂起或者退出Looper#loop()方法

### 3.Looper
```java
msg.target.dispatchMessage(msg);
```
Looper太长了，这里只是贴出关键的代码

### 4.Handler - dispatchMessage
兜兜转转又回来了，Handler#dispatchMessage
```java
/**
 * Handle system messages here.
 */
public void dispatchMessage(@NonNull Message msg) {
    if (msg.callback != null) {
        handleCallback(msg);
    } else {
        if (mCallback != null) {
            if (mCallback.handleMessage(msg)) {
                return;
            }
        }
        handleMessage(msg);
    }
}
```

最后消息都被处理掉了。
这样看来，问题好像更明显了，好像更看不到线程间通信的东西了？？？

## 实际使用
### 主线程
```java
class Demo {
    
    private static Handler mHandler = new Handler(Looper.getMainLooper());


    public void refreshViewState(){
        mHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                // do something
            }
        }, 2000);
    }
}

```

Looper.getMainLooper() 重点在这里
```java
private static Looper sMainLooper; 

public static void prepareMainLooper() {
    prepare(false);
    synchronized (Looper.class) {
        if (sMainLooper != null) {
            throw new IllegalStateException("The main Looper has already been prepared.");
        }
        sMainLooper = myLooper();
    }
}


public static Looper getMainLooper() {
    synchronized (Looper.class) {
        return sMainLooper;
    }
}
```

prepareMainLooper() 只会在ActivityThread中被调用一次，并且设置给Looper#sMainLooper
那么，思路是不是清晰了？
```java
public Handler(@NonNull Looper looper, @Nullable Callback callback, boolean async) {
    mLooper = looper;
    // 获取MessageQueue
    mQueue = looper.mQueue;
    mCallback = callback;
    mAsynchronous = async;
}
```

Handler的Queue是Looper中初始化的那个，而`Looper#sMainLooper`持有的就是主线程的消息队列，那么不管你在那个线程new出来的Handler,总是能在主线程被处理。

## HandlerThread
```java
public class Demo implements Handler.Callback{

    // 发送事件
    private Handler mHandler;
    
    private void initThread() {
        HandlerThread handlerThread = new HandlerThread("Demo");
        handlerThread.start();
        mHandler = new Handler(handlerThread.getLooper(), this);
    }

    @Override
    public boolean handleMessage(@NonNull Message msg) {
        // do somethings
        // 处理
        return false;
    }
}
```
这里是HandlerThread的一段使用过程。
```java
public class HandlerThread extends Thread {
    
    Looper mLooper;
    private @Nullable Handler mHandler;


    @Override
    public void run() {
        mTid = Process.myTid();
        // 创建了属于本线程的Looper + MessageQueue
        Looper.prepare();
        synchronized (this) {
            mLooper = Looper.myLooper();
            notifyAll();
        }
        Process.setThreadPriority(mPriority);
        onLooperPrepared();
        // 开启Looper循环
        Looper.loop();
        mTid = -1;
    }
    
    /**
     * @return The looper.
     */
    public Looper getLooper() {
        // 略
        return mLooper;
    }
}
```

Demo#mHandler传入的Looper是`handlerThread.getLooper()`,那么通过这个Handler发送出去的Message就都是在`handlerThread.getLooper()`所在线程进行的。


## 总结
实际上应该是给对应线程的Looper -> MessageQueue中增加消息；
Looper在那个线程中启动，通过这个Looper创建的Handler消息就是在那个线程处理，在那里发送的并不重要，重要的是Looper实例在那个线程启动的.



