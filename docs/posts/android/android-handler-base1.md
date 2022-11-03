---
title: Android事件分发机制-ViewGroup
lang: zh-CN
tags:
  - Android
  - Handler
date: 2021-09-20
---

## 前言

当一个进程启动后，怎么保证它一直运行？最简单的方法就是开启一个`while`循环。
在音视频的开发过程中，我们是怎么保证不停的编解码，同时又能接受键盘鼠标的输入呢？
同样的做法，就是在各自线程中启动了一个循环，通过信号量来进行控制。

那么Andoird的世界中，`Handler`就是那个循环，不断的处理输入信息，各种生命周期的回调以及刷新UI的构成都有Handler的参与。

Handler的Java层主要由`Looper`,`Message`,`MessageQueue`,`Handler`构成：
* Looper 负责轮询,并且将消息分发
* Message 承载消息，`what` 标识, `when` 时间, `data` 数据,`target` Handler,而`Message`自己那是一个单链表
* MessageQueue 主要是负责对`Message`的各种操作，如放入消息
* Handler 收发消息

<!-- more -->

下面分开来看看这4个部分的作用。

## 前置知识点

### ThreadLocal

```java
// 在Looper中有这么一行
static final ThreadLocal<Looper> sThreadLocal = new ThreadLocal<Looper>();

// Looper会将自己保存在ThreadLocal中
// Initialize the current thread as a looper.
public static void prepare() {
    prepare(true);
}

private static void prepare(boolean quitAllowed) {
    if (sThreadLocal.get() != null) {
        throw new RuntimeException("Only one Looper may be created per thread");
    }
    sThreadLocal.set(new Looper(quitAllowed));
}
```

现在只关注两个方法：
```java
// set 方法
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}

// get 方法
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}

```

* `Thread t = Thread.currentThread()` 获取当前的线程
* `ThreadLocalMap map = getMap(t);`  当前线程中保存的数据`ThreadLocalMap`

结合`Thread.java`分析我们可以确定的是
* ThreadLocal 是和当前所在线程紧密绑定的
* ThreadLocalMap的键值为ThreadLocal，所以每个线程中可有多个ThreadLocal变量
* 必须先保存，再使用，否则error

### Epoll
关键函数
* `epoll_create()/epoll_create1()` 创建epoll实例,并返回相应的文件描述符
* `epoll_ctl()` 事件注册函数,将需要监听的文件描述符添加到epoll中
* `epoll_wait()` 用于等待IO事件,如果当前没有可用事件，会阻塞调用线程

我们重点需要了解的是：epoll_wait中timeout
```cpp
 int epoll_wait(int epfd, struct epoll_event *events,
                      int maxevents, int timeout);
```
timeout
* timeout > 0 则最多等待 timeoutMillis
    * 一个文件描述符触发事件
    * 被一个信号处理函数打断，或者timeout超时
* timeout = 0 就算没有任何事件，也会立刻返回
* timeout < 0 无限等待

## Message

```java
public final class Message implements Parcelable 
```

### Fileds
* `public int what`  标记位
* `public long when`  时间
* `Bundle data`   数据
* `Object obj`  消息的内容
* `Handler target`  指定处理对象
* `Runnable callback`  回调方法
* `Message next` 链表的下一个对象


### 享元模式
Message通过它的`obtain()` 以及`recycle()`构成了一个简单的享元模式，通过对Message实体的重用，减小的对内存的压力，避免重复创建新的Message对象。

### obtain()
obtain 有一系列的方法
文档的说法是：Return a new Message instance from the global pool. 
```java
Message m = sPool;
sPool = m.next;
```
即是，拿走了sPool中的第一个元素

### recycle()
recycle + recycleUnchecked() 
```java
#Clear out all other details

next = sPool;
sPool = this;

```
第一步是清除了Message中所有的数据
第二步，把自己放在了sPool的第一个

## Looper
```java
public final class Looper
```

### Fileds
* `final MessageQueue mQueue`  message queue的实体，由Looper创建
* `static final ThreadLocal<Looper> sThreadLocal`  Looper创建，保存自己

### Prepare
```java
// 私有构造，只能通过Prepare创建实例
private Looper(boolean quitAllowed) {
    mQueue = new MessageQueue(quitAllowed);
    mThread = Thread.currentThread();
}

// 创建可以退出的Looper,内部调用prepare(boolean quitAllowed)
public static void prepare() {
    prepare(true);
}

// 生成了
private static void prepare(boolean quitAllowed) {
    if (sThreadLocal.get() != null) {
        throw new RuntimeException("Only one Looper may be created per thread");
    }
    sThreadLocal.set(new Looper(quitAllowed) /* 1 */  );  
}
```

* `1` 中，通过构造方法生成了MessageQueue对象，并且把当前的Thread纪录下来
* `sThreadLocal` 中保存了Looper自己

> prepareMainLooper()

被标记为`@Deprecated`,不允许开发者自己调用，它和`prepare()`基本一致，只是把自己的实例，赋值给了静态变量` sMainLooper` ,而我们平时通过`getMainLooper()`获取到的就是它了。


### Quit
```java
public void quit() {
    mQueue.quit(false);
}

public void quitSafely() {
    mQueue.quit(true);
}
```

最终调用的是`MessageQueue#quit(boolean safe)`

* 当safe = true 时，只移除尚未触发的所有消息
* 当safe = flase 时，移除所有的消息


### loop()
消息处理的核心部分,源码中有很多Log，Trace的部分，我们先省略他们

```java
/**
 * Run the message queue in this thread. Be sure to call
 * {@link #quit()} to end the loop.
 */
public static void loop() {

    // 通过sThreadLocal获取当前线程下的Looper实例
    final Looper me = myLooper();
    if (me == null) {
        throw new RuntimeException("No Looper; Looper.prepare()....");
    }
    
    // 获取到Looper中的MessageQueue
    me.mInLoop = true;
    final MessageQueue queue = me.mQueue;

    // 这里是一个权限相关的检查，
    // 清空调用端的uid和pid，换成自己进程的uid，pid
    Binder.clearCallingIdentity();
    final long ident = Binder.clearCallingIdentity();

    for (;;) {
        // 获取到MessageQueue中的一条message
        // 这里注释中的might block 需要特别关注
        Message msg = queue.next(); // might block
        
        // messageQueue 发出终止信号，退出这个Loop
        if (msg == null) {
            // No message indicates that the message queue is quitting.
            return;
        }
       
        long origWorkSource = ThreadLocalWorkSource.setUid(msg.workSourceUid);
        try {
            // 处理消息
            msg.target.dispatchMessage(msg);
        } catch (Exception exception) {
            throw exception;
        } finally {
            ThreadLocalWorkSource.restore(origWorkSource);
        }
       
        // 确保在dispatching的过程中，identity没有被修改
        // Make sure that during the course of dispatching the
        // identity of the thread wasn't corrupted.
        final long newIdent = Binder.clearCallingIdentity();
        if (ident != newIdent) {
            Log.wtf(TAG, "Thread identity changed from 0x"
                    + Long.toHexString(ident) + " to 0x"
                    + Long.toHexString(newIdent) + " while dispatching to "
                    + msg.target.getClass().getName() + " "
                    + msg.callback + " what=" + msg.what);
        }
        // 回收这个Message对象
        msg.recycleUnchecked();
    }
}
```

loop()循环执行，直到messageQueue退出，loop也随之退出循环
#### 主要过程：

1. 获取Message   queue.next()
2. 分发消息   msg.target.dispatchMessage(msg)
3. 回收消息   msg.recycleUnchecked()


## MessageQueue 
```java
public final class MessageQueue
```


### Fileds

* `private long mPtr` native 层的NativeMessageQueue
* `Message mMessages` 需要处理的消息
* `ArrayList<IdleHandler> mIdleHandlers`  空闲`mMessages`没有消息或为null


### native方法
```java
private native static long nativeInit();
private native static void nativeDestroy(long ptr);
private native void nativePollOnce(long ptr, int timeoutMillis);
private native static void nativeWake(long ptr);
private native static boolean nativeIsPolling(long ptr);
private native static void nativeSetFileDescriptorEvents(long ptr, int fd, int events);
```

> frameworks/base/core/jni/android_os_MessageQueue.cpp

#### nativeInit()
```cpp
# 创建了一个NativeMessageQueue实例
static jlong android_os_MessageQueue_nativeInit(JNIEnv* env, jclass clazz) {
    NativeMessageQueue* nativeMessageQueue = new NativeMessageQueue();
    if (!nativeMessageQueue) {
        jniThrowRuntimeException(env, "Unable to allocate native queue");
        return 0;
    }

    nativeMessageQueue->incStrong(env);
    return reinterpret_cast<jlong>(nativeMessageQueue);
}
```

如果顺着这条线继续挖下去，NativeMessageQueue中还创建了Looper.cpp

```cpp
# system/core/libutils/Looper.cpp
NativeMessageQueue::NativeMessageQueue() :
        mPollEnv(NULL), mPollObj(NULL), mExceptionObj(NULL) {
    mLooper = Looper::getForThread();
    if (mLooper == NULL) {
        mLooper = new Looper(false);
        Looper::setForThread(mLooper);
    }
}
```

Looper中使用的就是信号,epoll了
```cpp
Looper::Looper(bool allowNonCallbacks)
    : mAllowNonCallbacks(allowNonCallbacks),
      mSendingMessage(false),
      mPolling(false),
      mEpollRebuildRequired(false),
      mNextRequestSeq(WAKE_EVENT_FD_SEQ + 1),
      mResponseIndex(0),
      mNextMessageUptime(LLONG_MAX) {
    mWakeEventFd.reset(eventfd(0, EFD_NONBLOCK | EFD_CLOEXEC));
    LOG_ALWAYS_FATAL_IF(mWakeEventFd.get() < 0, "Could not make wake event fd: %s", strerror(errno));

    AutoMutex _l(mLock);
    rebuildEpollLocked();
}
```
我们就不过多的深入了。



#### nativeDestroy(long ptr)
```cpp
# 对传入ptr指向的queue进行销毁
static void android_os_MessageQueue_nativeDestroy(JNIEnv* env, jclass clazz, jlong ptr) {
    NativeMessageQueue* nativeMessageQueue = reinterpret_cast<NativeMessageQueue*>(ptr);
    nativeMessageQueue->decStrong(env);
}
```

#### nativePollOnce(long ptr, int timeoutMillis)
```cpp
static void android_os_MessageQueue_nativePollOnce(JNIEnv* env, jobject obj,
        jlong ptr, jint timeoutMillis) {
    NativeMessageQueue* nativeMessageQueue = reinterpret_cast<NativeMessageQueue*>(ptr);
    nativeMessageQueue->pollOnce(env, obj, timeoutMillis);
}

void NativeMessageQueue::pollOnce(JNIEnv* env, jobject pollObj, int timeoutMillis) {
    mPollEnv = env;
    mPollObj = pollObj;
    
    #调用了 mLooper 的 pollOnce
    mLooper->pollOnce(timeoutMillis);
    mPollObj = NULL;
    mPollEnv = NULL;

    if (mExceptionObj) {
        env->Throw(mExceptionObj);
        env->DeleteLocalRef(mExceptionObj);
        mExceptionObj = NULL;
    }
}
```

pollOnce 是Looper.cpp中的方法，我们查看源码会发现
```cpp
int Looper::pollInner(int timeoutMillis) {
    // 略
    // Poll.
    int result = POLL_WAKE;
    mResponses.clear();
    mResponseIndex = 0; 
    
    // We are about to idle.
    mPolling = true;

    struct epoll_event eventItems[EPOLL_MAX_EVENTS];
    
    // timeoutMillis由Java层传入
    int eventCount = epoll_wait(mEpollFd.get(), eventItems, EPOLL_MAX_EVENTS, timeoutMillis);

    // No longer idling.
    mPolling = false;

    // Acquire lock.
    mLock.lock();

    // 略
    // Handle all events.
    for (int i = 0; i < eventCount; i++) {
        const SequenceNumber seq = eventItems[i].data.u64;
        uint32_t epollEvents = eventItems[i].events;
        if (seq == WAKE_EVENT_FD_SEQ) {
            if (epollEvents & EPOLLIN) {
                awoken();
            } else {
                // 略
            }
        } else {
            // 略
        }
    }
    //略
    // Release lock.
    mLock.unlock();
     //略
    return result;
}
```

#### nativeWake(long ptr)

```cpp
// android_os_MessageQueue.cpp
static void android_os_MessageQueue_nativeWake(JNIEnv* env, jclass clazz, jlong ptr) {
    NativeMessageQueue* nativeMessageQueue = reinterpret_cast<NativeMessageQueue*>(ptr);
    nativeMessageQueue->wake();
}

void NativeMessageQueue::wake() {
    mLooper->wake();
}

// Looper.cpp
void Looper::wake() {
    uint64_t inc = 1;
    ssize_t nWrite = TEMP_FAILURE_RETRY(write(mWakeEventFd, &inc, sizeof(uint64_t)));
    if (nWrite != sizeof(uint64_t)) {
        if (errno != EAGAIN) {
            LOG_ALWAYS_FATAL("Could not write wake signal to fd %d: %s",
                    mWakeEventFd, strerror(errno));
        }
    }
}
```

(write(mWakeEventFd, &inc, sizeof(uint64_t)))
这一步向`mWakeEventFd`中写入了一个数据，那么`mWakeEventFd`就可以被读取了，从而`nativePollOnce`就会被唤醒，也就是意味刚才调用`nativePollOnce`的线程会从这里唤醒，继续执行方法 

Looper.java -> Looper.loop() ->  mQueue.next() -> nativePollOnce

也就是说，Looper.loop()中，会继续执行mQueue.next()之后的代码

#### nativeIsPolling(long ptr)
```cpp
# 是否Looper运行中
bool Looper::isPolling() const {
    return mPolling;
}
```

#### nativeSetFileDescriptorEvents()
```java
addOnFileDescriptorEventListener(@NonNull FileDescriptor fd,
            @OnFileDescriptorEventListener.Events int events,
            @NonNull OnFileDescriptorEventListener listener)


removeOnFileDescriptorEventListener(@NonNull FileDescriptor fd)
```

对外提供接口方法，没有使用过这两个方法。


### MessageQueue(boolean quitAllowed)
```java
MessageQueue(boolean quitAllowed) {
    mQuitAllowed = quitAllowed;
    mPtr = nativeInit();
}
```
Message是由Looper创建的，上面已经写到了

其中` mPtr = nativeInit()` 是Native方法,创建了一个NativeMessageQueue的实例，并且把指针返回出来


### enqueueMessage(Message msg, long when)
添加一条消息到消息队列中去

```java
boolean enqueueMessage(Message msg, long when) {
    // 我们开发中使用的普通消息，必须要带上target
    // postSyncBarrier 才可以不需要target
    if (msg.target == null) {
        throw new IllegalArgumentException("Message must have a target.");
    }

    synchronized (this) {
        if (msg.isInUse()) {
            throw new IllegalStateException(msg + " This message is already in use.");
        }

        if (mQuitting) {
            IllegalStateException e = new IllegalStateException(
                    msg.target + " sending message to a Handler on a dead thread");
            Log.w(TAG, e.getMessage(), e);
            
            // 退出时，回收msg到消息池
            msg.recycle();
            return false;
        }
        
        msg.markInUse();
        msg.when = when;
        // 当前消息队列
        Message p = mMessages;
        boolean needWake;
        if (p == null || when == 0 || when < p.when) {
            // 当前消息队列为空时，或者when为0，需要优先处理
            msg.next = p;
            // 赋值mMessages
            mMessages = msg;
            // 如果之前在阻塞，这里需要标记唤醒
            needWake = mBlocked;
        } else {
            // 消息队列不为空，但是队列头是一个barrier消息，同时传入的msg是异步消息
            // 之前在阻塞,那么才需要去唤醒
            needWake = mBlocked && p.target == null && msg.isAsynchronous();
            Message prev;
            for (;;) {
                // 下面一系列的操作是确保传入的消息when可以在队列的第一个位置，
                // 否则不执行needWake
                prev = p;
                p = p.next;
                if (p == null || when < p.when) {
                    break;
                }
                if (needWake && p.isAsynchronous()) {
                    needWake = false;
                }
            }
            // 把自己放在队列头部
            msg.next = p; // invariant: p == prev.next
            prev.next = msg;
        }
        // 执行唤醒操作
        if (needWake) {
            nativeWake(mPtr);
        }
    }
    return true;
}
```

插入消息，同时保证插入的消息在整个队列中在正确的位置。
同时这里也处理的同步屏障的逻辑，如果这里有屏障在，不会执行唤醒操作。


### postSyncBarrier()
发送一个同步屏障
```java
public int postSyncBarrier() {
    return postSyncBarrier(SystemClock.uptimeMillis());
}

private int postSyncBarrier(long when) {
    synchronized (this) {
        final int token = mNextBarrierToken++;
        final Message msg = Message.obtain();
        msg.markInUse();
        msg.when = when;
        msg.arg1 = token;

        Message prev = null;
        Message p = mMessages;
       
        if (when != 0) {
            while (p != null && p.when <= when) {
                prev = p;
                p = p.next;
            }
        }
        if (prev != null) { // invariant: p == prev.next
            msg.next = p;
            prev.next = msg;
        } else {
            msg.next = p;
            mMessages = msg;
        }
        return token;
    }
}

```

和`enqueueMessage`不同，这里的message.target是为null的，并且不会执行唤醒操作。

### removeMessages
```java
 void removeMessages(Handler h, int what, Object object) {
    if (h == null) {
        return;
    }

    synchronized (this) {
        Message p = mMessages;

        // Remove all messages at front.
        while (p != null && p.target == h && p.what == what
               && (object == null || p.obj == object)) {
            Message n = p.next;
            mMessages = n;
            p.recycleUnchecked();
            p = n;
        }

        // Remove all messages after front.
        while (p != null) {
            Message n = p.next;
            if (n != null) {
                if (n.target == h && n.what == what
                    && (object == null || n.obj == object)) {
                    Message nn = n.next;
                    n.recycleUnchecked();
                    p.next = nn;
                    continue;
                }
            }
            p = n;
        }
    }
}
```

移除满足条件的Message，两个while,一个从头部开始移除，一个从尾部开始移除掉满足条件的所有Message


### removeSyncBarrier(int token)
移除掉同步屏障，一般来说，谁添加的，谁负责移除掉
```java
public void removeSyncBarrier(int token) {
    // Remove a sync barrier token from the queue.
    // If the queue is no longer stalled by a barrier then wake it.
    synchronized (this) {
        Message prev = null;
        Message p = mMessages;
        // 找到第一个非同步屏障的消息，或者不是当前token的消息
        // 退出循环后p就指向那个指定要删除的同步消息
        while (p != null && (p.target != null || p.arg1 != token)) {
            prev = p;
            p = p.next;
        }
        if (p == null) {
            throw new IllegalStateException("The specified message queue synchronization "
                    + " barrier token has not been posted or has already been removed.");
        }
        final boolean needWake;
        // prev 不为空，就去赋值
        if (prev != null) {
            prev.next = p.next;
            needWake = false;
        } else {
            mMessages = p.next;
            needWake = mMessages == null || mMessages.target != null;
        }
        p.recycleUnchecked();

        // If the loop is quitting then it is already awake.
        // We can assume mPtr != 0 when mQuitting is false.
        if (needWake && !mQuitting) {
            nativeWake(mPtr);
        }
    }
}
```
* 重复移除会异常
* 移除后如果


### next()

```java
Message next() {
// 异常退出
final long ptr = mPtr;
if (ptr == 0) {
    return null;
}

// 第一次循环 pendingIdleHandlerCount = -1
// nextPollTimeoutMillis = 0
// 后面，这两个值都会被修改赋值
int pendingIdleHandlerCount = -1; // -1 only during first iteration
int nextPollTimeoutMillis = 0;

for (;;) {
    if (nextPollTimeoutMillis != 0) {
        Binder.flushPendingCommands();
    }
    
    // 开始等待，因为第一次nextPollTimeoutMillis = 0 
    // 会立即返回
    nativePollOnce(ptr, nextPollTimeoutMillis);

    synchronized (this) {
        // Try to retrieve the next message.  Return if found.
        final long now = SystemClock.uptimeMillis();
        Message prevMsg = null;
        Message msg = mMessages;
        if (msg != null && msg.target == null) {
            // 找到异步消息，退出while循环
            do {
                prevMsg = msg;
                msg = msg.next;
            } while (msg != null && !msg.isAsynchronous());
        }
        if (msg != null) {
            // 异步消息触发时间大于当前时间，设置下一次轮询的超时时长
            if (now < msg.when) {
                nextPollTimeoutMillis = (int) Math.min(msg.when - now, Integer.MAX_VALUE);
            } else {
                // 否则获取一条消息，返回给Looper.
                mBlocked = false;
                if (prevMsg != null) {
                    prevMsg.next = msg.next;
                } else {
                    mMessages = msg.next;
                }
                msg.next = null;
                msg.markInUse();
                return msg;
            }
        } else {
            // nativePollOnce 中 epoll 会阻塞，一直等待
            nextPollTimeoutMillis = -1;
        }

        // 退出
        if (mQuitting) {
            dispose();
            return null;
        }

        // 当队列为空，或者第一个消息开始执行，赋值pendingIdleHandlerCount为mIdleHandlers的长度
        if (pendingIdleHandlerCount < 0
                && (mMessages == null || now < mMessages.when)) {
            pendingIdleHandlerCount = mIdleHandlers.size();
        }
        if (pendingIdleHandlerCount <= 0) {
            //没有idleHandler 需要运行，循环并等待。
            mBlocked = true;
            continue;
        }

        if (mPendingIdleHandlers == null) {
            mPendingIdleHandlers = new IdleHandler[Math.max(pendingIdleHandlerCount, 4)];
        }
        mPendingIdleHandlers = mIdleHandlers.toArray(mPendingIdleHandlers);
    }

    // 只运行一次，而后置pendingIdleHandlerCount为0，本次next中不会再运行了
    for (int i = 0; i < pendingIdleHandlerCount; i++) {
        final IdleHandler idler = mPendingIdleHandlers[i];
        // 移除引用，因为不会再发送了
        mPendingIdleHandlers[i] = null; 

        boolean keep = false;
        try {
            // 执行idler
            keep = idler.queueIdle();
        } catch (Throwable t) {
            Log.wtf(TAG, "IdleHandler threw exception", t);
        }
            
        if (!keep) {
            synchronized (this) {
                mIdleHandlers.remove(idler);
            }
        }
    }

    // 重置pendingIdleHandlerCount为0
    pendingIdleHandlerCount = 0;

    // While calling an idle handler, a new message could have been delivered
    // so go back and look again for a pending message without waiting.
    // 当调用一个idleHandler时，可以去执行新的message，因此nextPollTimeoutMillis置为0，直接去执行即可
    nextPollTimeoutMillis = 0;
}
}
```

nativePollOnce()在native中的操作特别多，在native的android_os_MessageQueue_nativePollOnce中已经略微说明了一些关键的步骤，这里不再复述了
特别要注意nativePollOnce是一个阻塞操作，它可以阻塞Looper的"死循环"，如果`nextPollTimeoutMillis = -1`就会一直等待。

IdleHandler会在空闲时被调用，我们常常可以用来发起网络请求


## Handler
(由于网络问题，这里只能先看9.0.0 Pie的源码了)
### 构造函数
Handler的构造函数太多了，只看几个常用的。

#### 默认构造
```java
// 常用的直接new
public Handler() {
    this(null, false);
}

public Handler(Callback callback, boolean async) {
    if (FIND_POTENTIAL_LEAKS) {
        final Class<? extends Handler> klass = getClass();
        if ((klass.isAnonymousClass() || klass.isMemberClass() || klass.isLocalClass()) &&
                (klass.getModifiers() & Modifier.STATIC) == 0) {
            Log.w(TAG, "The following Handler class should be static or leaks might occur: " +
                klass.getCanonicalName());
        }
    }
201
    mLooper = Looper.myLooper();
    if (mLooper == null) {
        throw new RuntimeException(
            "Can't create handler inside thread " + Thread.currentThread()
                    + " that has not called Looper.prepare()");
    }
    mQueue = mLooper.mQueue;
    mCallback = callback;
    mAsynchronous = async;
}
```
直接使用`new Handler`的方式，我们可以看到，它会去调用`Handler(Callback callback, boolean async)`
* `mLooper = Looper.myLooper()` 会默认使用本线程的Handler
* `async`  mAsynchronous赋值操作，这里是区别同步消息还是异步消息，我们通常只会使用同步消息，异步消息配合同步屏障使用

**要注意的是，在使用Handler的时候，建议使用static**

#### 带参数
```java
public Handler(Looper looper) {
    this(looper, null, false);
}

public Handler(Looper looper, Callback callback) {
    this(looper, callback, false);
}

public Handler(Looper looper, Callback callback, boolean async) {
    mLooper = looper;
    mQueue = looper.mQueue;
    mCallback = callback;
    mAsynchronous = async;
}
```

通常我们会使用,`Handler(Looper.getMainLooper())`的形式，去创建一个主线程的Handler来使用，其他的同上`默认构造`

### post 发送Messages
```java
postAtTime(Runnable r, long uptimeMillis)
postAtTime(Runnable r, Object token, long uptimeMillis)
postDelayed(Runnable r, long delayMillis)
postDelayed(Runnable r, Object token, long delayMillis)
postAtFrontOfQueue(Runnable r)
```

post系列的方法，经过`getPostMessage`封装后，都会调用对应的send系列方法

```java
private static Message getPostMessage(Runnable r) {
    Message m = Message.obtain();
    m.callback = r;
    return m;
}
private static Message getPostMessage(Runnable r, Object token) {
    Message m = Message.obtain();
    m.obj = token;
    m.callback = r;
    return m;
}
```

### send 发送Messages
```java
sendMessage(Message msg)
sendEmptyMessage(int what)
sendEmptyMessageDelayed(int what, long delayMillis)
sendEmptyMessageAtTime(int what, long uptimeMillis) 
sendMessageDelayed(Message msg, long delayMillis)
sendMessageAtTime(Message msg, long uptimeMillis)
sendMessageAtFrontOfQueue(Message msg)
```
而send系列的方法最后调用的是queue.enqueueMessage(msg, uptimeMillis)方法
```java
private boolean enqueueMessage(MessageQueue queue, Message msg, long uptimeMillis) {
    msg.target = this;
    if (mAsynchronous) {
        msg.setAsynchronous(true);
    }
    return queue.enqueueMessage(msg, uptimeMillis);
}
```
我们`msg.setAsynchronous(true);`，这里的`mAsynchronous`就是通过构造方法传入的，是否异步方法，如果是的话，会在这里加上标记。
#### 特殊方法
**sendMessageAtFrontOfQueue(Message msg)**
通过把`when`置为0，让它可以加入到MessageQueue的头部

**runWithScissors(final Runnable r, long timeout)**
This method is dangerous!  Improper use can result in deadlocks.
Never call this method while any locks are held or use it in a
possibly re-entrant manner.
不仅仅被标注为`@hide`还注释说，非常危险，可能会造成死锁，不要去使用它。
这里不展开说明，后续再研究。

### removeMessages 
```java
public final void removeCallbacks(Runnable r){
    mQueue.removeMessages(this, r, null);
}

public final void removeCallbacks(Runnable r, Object token){
    mQueue.removeMessages(this, r, token);
}

public final void removeMessages(int what) {
    mQueue.removeMessages(this, what, null);
}

public final void removeMessages(int what, Object object) {
    mQueue.removeMessages(this, what, object);
}
```

当我们在代码中使用了`Handler`，一定要记得异常退出啊，页面销毁的时候，移除掉Message


## 流程

![images-handler](https://image.wangzhumo.com/2021/09/android_handler_base1.png)

Handler 初始化的时候会创建或者被传入一个Looper
Looper 创建MessageQueue
MessageQueue  中会调用一系列的Native方法，开启Native的Queue,Looper等


1. Looper 初始化,绑定线程 （Looper 一个线程只有一个）
   因为MessageQueue也是由Looper创建的，所以它也只有一个
2. Looper.loop 开启
3. MessageQueue.next() 阻塞或者返回Message or  终止
4. Looper.loop -> mQueue.next() -> dispacthMessage
5. Message.callback 执行 or  Handler.mCallback 处理  or  Handler.handlerMessage处理

   
Handler是Android系统的重要部分，下一次我会尝试自己写出一个Handler实战   
   